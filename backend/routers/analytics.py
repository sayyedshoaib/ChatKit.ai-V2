
# routers/analytics.py

import csv
import io
import os
import re
from datetime import date, datetime, time, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from core.db import db
from routers.tenants import require_role


router = APIRouter()

CHAT_SESSION_COLLECTION = os.getenv("CHAT_SESSION_COLLECTION")
if not CHAT_SESSION_COLLECTION:
    raise RuntimeError("CHAT_SESSION_COLLECTION is not configured")

chat_sessions_collection = db[CHAT_SESSION_COLLECTION]


def utc_now():
    return datetime.now(timezone.utc)


def parse_date(value: Optional[date], *, end: bool = False):
    """Convert a date into a UTC datetime boundary."""
    if value is None:
        return None

    if end:
        return datetime.combine(
            value + timedelta(days=1), time.min, tzinfo=timezone.utc
        )

    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def build_session_filter(
    tenant_id: str,
    start_date: Optional[date],
    end_date: Optional[date],
):
    query = {"tenant_id": tenant_id}
    created_at_filter = {}

    start = parse_date(start_date)
    end = parse_date(end_date, end=True)

    if start:
        created_at_filter["$gte"] = start
    if end:
        created_at_filter["$lt"] = end

    if created_at_filter:
        query["created_at"] = created_at_filter

    return query


def build_event_date_filter(start_date, end_date):
    conditions = []
    start = parse_date(start_date)
    end = parse_date(end_date, end=True)

    if start:
        conditions.append({"analytics_events.timestamp": {"$gte": start}})
    if end:
        conditions.append({"analytics_events.timestamp": {"$lt": end}})

    return conditions


def as_number(value, default=0):
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return value
    return default


def event_pipeline(tenant_id, start_date, end_date):
    pipeline = [
        {"$match": {"tenant_id": tenant_id}},
        {"$unwind": "$analytics_events"},
    ]

    conditions = build_event_date_filter(start_date, end_date)
    if conditions:
        pipeline.append({"$match": {"$and": conditions}})

    return pipeline


# ---------------------------------------------------------
# Overview
# ---------------------------------------------------------

@router.get("/overview")
async def analytics_overview(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user=Depends(require_role("tenant")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, "start_date must be on or before end_date")

    tenant_id = user["tenant_id"]
    session_filter = build_session_filter(tenant_id, start_date, end_date)

    total_conversations = await chat_sessions_collection.count_documents(
        session_filter
    )

    summary_pipeline = [
        {"$match": session_filter},
        {
            "$project": {
                "user_id": 1,
                "message_count": {
                    "$size": {"$ifNull": ["$messages", []]}
                },
                "user_message_count": {
                    "$size": {
                        "$filter": {
                            "input": {"$ifNull": ["$messages", []]},
                            "as": "message",
                            "cond": {"$eq": ["$$message.sender", "user"]},
                        }
                    }
                },
            }
        },
        {
            "$group": {
                "_id": None,
                "messages": {"$sum": "$message_count"},
                "user_messages": {"$sum": "$user_message_count"},
                "users": {"$addToSet": "$user_id"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "messages": 1,
                "user_messages": 1,
                "unique_visitors": {"$size": "$users"},
            }
        },
    ]

    summaries = await chat_sessions_collection.aggregate(
        summary_pipeline
    ).to_list(length=1)

    summary = summaries[0] if summaries else {
        "messages": 0,
        "user_messages": 0,
        "unique_visitors": 0,
    }

    event_stats_pipeline = event_pipeline(
        tenant_id, start_date, end_date
    ) + [
        {
            "$group": {
                "_id": None,
                "total_events": {"$sum": 1},
                "avg_response_time_ms": {
                    "$avg": "$analytics_events.response_time_ms"
                },
                "success_events": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$analytics_events.status", "success"]},
                            1, 0,
                        ]
                    }
                },
                "fallback_events": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$analytics_events.status", "fallback"]},
                            1, 0,
                        ]
                    }
                },
                "error_events": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$analytics_events.status", "error"]},
                            1, 0,
                        ]
                    }
                },
            }
        }
    ]

    event_stats = await chat_sessions_collection.aggregate(
        event_stats_pipeline
    ).to_list(length=1)

    events = event_stats[0] if event_stats else {
        "total_events": 0,
        "avg_response_time_ms": 0,
        "success_events": 0,
        "fallback_events": 0,
        "error_events": 0,
    }

    return {
        "total_conversations": total_conversations,
        "total_messages": summary["messages"],
        "user_messages": summary["user_messages"],
        "unique_visitors": summary["unique_visitors"],
        "average_messages_per_conversation": round(
            summary["messages"] / total_conversations, 2
        ) if total_conversations else 0,
        "total_events": events["total_events"],
        "average_response_time_ms": round(
            as_number(events.get("avg_response_time_ms")), 2
        ),
        "success_events": events["success_events"],
        "fallback_events": events["fallback_events"],
        "error_events": events["error_events"],
    }


# ---------------------------------------------------------
# Conversation activity chart
# ---------------------------------------------------------

@router.get("/activity")
async def analytics_activity(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user=Depends(require_role("tenant")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, "start_date must be on or before end_date")

    session_filter = build_session_filter(
        user["tenant_id"], start_date, end_date
    )

    pipeline = [
        {"$match": session_filter},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                        "timezone": "UTC",
                    }
                },
                "conversations": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    rows = await chat_sessions_collection.aggregate(
        pipeline
    ).to_list(length=None)

    return [
        {"date": row["_id"], "conversations": row["conversations"]}
        for row in rows
    ]


# ---------------------------------------------------------
# Performance
# ---------------------------------------------------------

@router.get("/performance")
async def analytics_performance(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user=Depends(require_role("tenant")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, "start_date must be on or before end_date")

    pipeline = event_pipeline(
        user["tenant_id"], start_date, end_date
    ) + [
        {
            "$group": {
                "_id": "$analytics_events.status",
                "count": {"$sum": 1},
                "avg_response_time_ms": {
                    "$avg": "$analytics_events.response_time_ms"
                },
                "max_response_time_ms": {
                    "$max": "$analytics_events.response_time_ms"
                },
            }
        }
    ]

    rows = await chat_sessions_collection.aggregate(
        pipeline
    ).to_list(length=None)

    result = {
        "success": 0,
        "fallback": 0,
        "error": 0,
        "unknown": 0,
        "average_response_time_ms": 0,
        "max_response_time_ms": 0,
    }

    total_count = 0
    weighted_time = 0.0
    max_time = 0.0

    for row in rows:
        status = row.get("_id")
        count = row.get("count", 0)
        if status not in {"success", "fallback", "error"}:
            status = "unknown"

        result[status] += count
        avg_time = as_number(row.get("avg_response_time_ms"))
        weighted_time += avg_time * count
        total_count += count
        max_time = max(
            max_time,
            as_number(row.get("max_response_time_ms")),
        )

    result["average_response_time_ms"] = round(
        weighted_time / total_count, 2
    ) if total_count else 0
    result["max_response_time_ms"] = round(max_time, 2)

    return result


# ---------------------------------------------------------
# Agent analytics
# ---------------------------------------------------------

@router.get("/agents")
async def analytics_agents(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user=Depends(require_role("tenant")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, "start_date must be on or before end_date")

    pipeline = event_pipeline(
        user["tenant_id"], start_date, end_date
    ) + [
        {"$unwind": {
            "path": "$analytics_events.agent_names",
            "preserveNullAndEmptyArrays": False,
        }},
        {
            "$group": {
                "_id": "$analytics_events.agent_names",
                "invocations": {"$sum": 1},
                "avg_response_time_ms": {
                    "$avg": "$analytics_events.response_time_ms"
                },
                "errors": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$analytics_events.status", "error"]},
                            1, 0,
                        ]
                    }
                },
            }
        },
        {"$sort": {"invocations": -1}},
    ]

    rows = await chat_sessions_collection.aggregate(
        pipeline
    ).to_list(length=None)

    return [
        {
            "agent_name": row["_id"],
            "invocations": row["invocations"],
            "average_response_time_ms": round(
                as_number(row.get("avg_response_time_ms")), 2
            ),
            "errors": row["errors"],
        }
        for row in rows
    ]


# ---------------------------------------------------------
# FAQ and RAG knowledge metrics
# ---------------------------------------------------------

@router.get("/knowledge")
async def analytics_knowledge(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user=Depends(require_role("tenant")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, "start_date must be on or before end_date")

    pipeline = event_pipeline(
        user["tenant_id"], start_date, end_date
    ) + [
        {
            "$group": {
                "_id": None,
                "events": {"$sum": 1},
                "faq_matches": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$analytics_events.faq_matched", True]},
                            1, 0,
                        ]
                    }
                },
                "faq_misses": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$analytics_events.faq_matched", False]},
                            1, 0,
                        ]
                    }
                },
                "faq_unknown": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$analytics_events.faq_matched", None]},
                            1, 0,
                        ]
                    }
                },
                "rag_zero_results": {
                    "$sum": {
                        "$cond": [
                            {"$eq": ["$analytics_events.rag_results_count", 0]},
                            1, 0,
                        ]
                    }
                },
                "rag_searches_with_count": {
                    "$sum": {
                        "$cond": [
                            {"$isNumber": "$analytics_events.rag_results_count"},
                            1, 0,
                        ]
                    }
                },
                "rag_results_total": {
                    "$sum": {
                        "$cond": [
                            {"$isNumber": "$analytics_events.rag_results_count"},
                            "$analytics_events.rag_results_count",
                            0,
                        ]
                    }
                },
            }
        }
    ]

    rows = await chat_sessions_collection.aggregate(
        pipeline
    ).to_list(length=1)

    if not rows:
        return {
            "events": 0,
            "faq_matches": 0,
            "faq_misses": 0,
            "faq_unknown": 0,
            "rag_zero_results": 0,
            "rag_searches_with_count": 0,
            "rag_results_total": 0,
        }

    row = rows[0]
    row.pop("_id", None)
    return row


# ---------------------------------------------------------
# Conversation explorer
# ---------------------------------------------------------

@router.get("/conversations")
async def analytics_conversations(
    search: Optional[str] = Query(None, max_length=200),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user=Depends(require_role("tenant")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, "start_date must be on or before end_date")

    query = build_session_filter(
        user["tenant_id"], start_date, end_date
    )

    if search:
        safe_search = re.escape(search.strip())
        if safe_search:
            query["$or"] = [
                {"chat_id": {"$regex": safe_search, "$options": "i"}},
                {"user_id": {"$regex": safe_search, "$options": "i"}},
                {"messages.text": {"$regex": safe_search, "$options": "i"}},
            ]

    if status:
        if status not in {"success", "fallback", "error"}:
            raise HTTPException(
                400, "status must be success, fallback, or error"
            )
        query["analytics_events.status"] = status

    total = await chat_sessions_collection.count_documents(query)

    cursor = (
        chat_sessions_collection.find(
            query,
            {
                "_id": 0,
                "chat_id": 1,
                "user_id": 1,
                "created_at": 1,
                "last_activity_at": 1,
                "messages": 1,
                "analytics_events": 1,
            },
        )
        .sort("created_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )

    sessions = await cursor.to_list(length=page_size)
    result = []

    for session in sessions:
        messages = session.get("messages") or []
        events = session.get("analytics_events") or []
        durations = [
            as_number(event.get("response_time_ms"))
            for event in events
            if isinstance(event, dict)
            and isinstance(event.get("response_time_ms"), (int, float))
            and not isinstance(event.get("response_time_ms"), bool)
        ]

        statuses = [
            event.get("status")
            for event in events
            if isinstance(event, dict)
        ]

        result.append({
            "chat_id": session.get("chat_id"),
            "user_id": session.get("user_id"),
            "created_at": session.get("created_at"),
            "last_activity_at": session.get("last_activity_at"),
            "message_count": len(messages),
            "user_message_count": sum(
                1 for msg in messages if msg.get("sender") == "user"
            ),
            "average_response_time_ms": round(
                sum(durations) / len(durations), 2
            ) if durations else None,
            "status": (
                "error" if "error" in statuses
                else "fallback" if "fallback" in statuses
                else "success" if "success" in statuses
                else "no_activity"
            ),
        })

    return {
        "items": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/conversations/{chat_id}")
async def analytics_conversation_detail(
    chat_id: str,
    user=Depends(require_role("tenant")),
):
    session = await chat_sessions_collection.find_one(
        {
            "tenant_id": user["tenant_id"],
            "chat_id": chat_id,
        },
        {"_id": 0},
    )

    if not session:
        raise HTTPException(404, "Conversation not found")

    return session


# ---------------------------------------------------------
# CSV export
# ---------------------------------------------------------

@router.get("/export")
async def analytics_export(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    user=Depends(require_role("tenant")),
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, "start_date must be on or before end_date")

    query = build_session_filter(
        user["tenant_id"], start_date, end_date
    )

    cursor = chat_sessions_collection.find(query).sort("created_at", -1)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "chat_id",
        "user_id",
        "created_at",
        "last_activity_at",
        "message_count",
        "user_message_count",
        "event_count",
        "statuses",
        "average_response_time_ms",
    ])

    async for session in cursor:
        messages = session.get("messages") or []
        events = session.get("analytics_events") or []

        durations = [
            as_number(event.get("response_time_ms"))
            for event in events
            if isinstance(event, dict)
            and isinstance(event.get("response_time_ms"), (int, float))
            and not isinstance(event.get("response_time_ms"), bool)
        ]

        statuses = sorted({
            str(event.get("status"))
            for event in events
            if isinstance(event, dict) and event.get("status")
        })

        writer.writerow([
            session.get("chat_id", ""),
            session.get("user_id", ""),
            session.get("created_at", ""),
            session.get("last_activity_at", ""),
            len(messages),
            sum(1 for msg in messages if msg.get("sender") == "user"),
            len(events),
            ", ".join(statuses),
            round(sum(durations) / len(durations), 2) if durations else "",
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": 'attachment; filename="chatkit-analytics.csv"'
        },
    )
