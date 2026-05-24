from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt, datetime

app = FastAPI()
security = HTTPBearer()
SECRET = "supersecret"

users_db = {}

class SignupRequest(BaseModel):
    email: str
    password: str
    role: str   # "admin" or "tenant"
    tenant_id: str = None

class LoginRequest(BaseModel):
    email: str
    password: str

def create_token(data: dict):
    payload = {
        **data,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

@app.post("/signup")
def signup(req: SignupRequest):
    if req.email in users_db:
        raise HTTPException(status_code=400, detail="User already exists")
    users_db[req.email] = {
        "password": req.password,
        "role": req.role,
        "tenant_id": req.tenant_id
    }
    return {"message": "User created"}

@app.post("/login")
def login(req: LoginRequest):
    user = users_db.get(req.email)
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"role": user["role"], "tenant_id": user.get("tenant_id")})
    return {"access_token": token, "token_type": "Bearer"}

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(token.credentials, SECRET, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(role: str):
    def role_checker(user=Depends(get_current_user)):
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail=f"{role} role required")
        return user
    return role_checker

@app.get("/admin-only")
def admin_api(user=Depends(require_role("admin"))):
    return {"message": "Hello Admin"}

@app.get("/tenant-only")
def tenant_api(user=Depends(require_role("tenant"))):
    return {"message": f"Hello Tenant {user['tenant_id']}"}

@app.get("/public")
def public_api():
    return {"message": "Anyone can access this"}