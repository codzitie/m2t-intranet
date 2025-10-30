from database import SessionLocal, User, LeaveType, LeaveBalance, init_db
from auth import hash_password
from datetime import date

def seed_database():
    """Populate database with initial test data"""
    
    # Initialize database tables
    print("🔧 Initializing database tables...")
    init_db()
    
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("⚠️  Database already has data. Skipping seed.")
            print(f"   Found {existing_users} existing users.")
            return
        
        print("\n📊 Seeding database with test data...\n")
        
        # ============= CREATE LEAVE TYPES =============
        print("1️⃣  Creating leave types...")
        leave_types = [
            LeaveType(id=1, name="Casual Leave", yearly_quota=12, color="#3B82F6", is_active=True),
            LeaveType(id=2, name="Sick Leave", yearly_quota=6, color="#EF4444", is_active=True),
            LeaveType(id=3, name="Earned Leave", yearly_quota=15, color="#10B981", is_active=True),
            LeaveType(id=4, name="Emergency Leave", yearly_quota=3, color="#F59E0B", is_active=True),
        ]
        
        for leave_type in leave_types:
            db.add(leave_type)
        
        db.commit()
        print("   ✅ Created 4 leave types")
        
        # ============= CREATE TEST USERS =============
        print("\n2️⃣  Creating test users...")
        
        # CEO (top level)
        ceo = User(
            email="ceo@m2t-ai.com",
            name="Nanda Kumar",
            password_hash=hash_password("password123"),
            role="CEO",
            department="Management",
            designation="Chief Executive Officer",
            supervisor_id=None,
            join_date=date(2020, 1, 15)
        )
        db.add(ceo)
        db.commit()
        db.refresh(ceo)
        print("   ✅ Created CEO: ceo@m2t-ai.com (Nanda Kumar) / password123")
        
        # HR Manager (reports to CEO)
        hr = User(
            email="hr@m2t-ai.com",
            name="Nandini",
            password_hash=hash_password("password123"),
            role="HR",
            department="Human Resources",
            designation="HR Manager",
            supervisor_id=ceo.id,
            join_date=date(2021, 3, 1)
        )
        db.add(hr)
        db.commit()
        db.refresh(hr)
        print("   ✅ Created HR: hr@m2t-ai.com (Nandini) / password123")
        
        # Engineering Manager (reports to CEO)
        manager = User(
            email="manager@m2t-ai.com",
            name="Sai Kumar",
            password_hash=hash_password("password123"),
            role="Manager",
            department="Engineering",
            designation="Engineering Manager",
            supervisor_id=ceo.id,
            join_date=date(2021, 6, 1)
        )
        db.add(manager)
        db.commit()
        db.refresh(manager)
        print("   ✅ Created Manager: manager@m2t-ai.com (Sai Kumar) / password123")
        
        # Team Lead (reports to Manager)
        team_lead = User(
            email="teamlead@m2t-ai.com",
            name="Pragati Gupta",
            password_hash=hash_password("password123"),
            role="Team Lead",
            department="Engineering",
            designation="Team Lead - Development",
            supervisor_id=manager.id,
            join_date=date(2022, 1, 15)
        )
        db.add(team_lead)
        db.commit()
        db.refresh(team_lead)
        print("   ✅ Created Team Lead: teamlead@m2t-ai.com (Pragati Gupta) / password123")
        
        # Employees (report to Team Lead)
        employees = [
            User(
                email="dharun@m2t-ai.com",
                name="Dharun",
                password_hash=hash_password("password123"),
                role="Employee",
                department="Engineering",
                designation="Software Developer",
                supervisor_id=team_lead.id,
                join_date=date(2023, 3, 20)
            ),
            User(
                email="nikhil@m2t-ai.com",
                name="Nikhil",
                password_hash=hash_password("password123"),
                role="Employee",
                department="Engineering",
                designation="Software Developer",
                supervisor_id=team_lead.id,
                join_date=date(2023, 4, 15)
            ),
            User(
                email="krishna@m2t-ai.com",
                name="Krishna",
                password_hash=hash_password("password123"),
                role="Employee",
                department="Engineering",
                designation="Junior Developer",
                supervisor_id=team_lead.id,
                join_date=date(2023, 6, 1)
            ),
            User(
                email="sudharsan@m2t-ai.com",
                name="Sudharsan",
                password_hash=hash_password("password123"),
                role="Employee",
                department="Engineering",
                designation="Junior Developer",
                supervisor_id=team_lead.id,
                join_date=date(2023, 8, 10)
            ),
            User(
                email="priyanshu@m2t-ai.com",
                name="Priyanshu",
                password_hash=hash_password("password123"),
                role="Employee",
                department="Engineering",
                designation="Software Developer",
                supervisor_id=team_lead.id,
                join_date=date(2023, 9, 5)
            ),
        ]
        
        for emp in employees:
            db.add(emp)
        
        db.commit()
        print(f"   ✅ Created {len(employees)} employees")
        
        # ============= CREATE LEAVE BALANCES =============
        print("\n3️⃣  Creating leave balances for all users...")
        
        all_users = db.query(User).all()
        current_year = date.today().year
        balance_count = 0
        
        for user in all_users:
            for leave_type in leave_types:
                balance = LeaveBalance(
                    user_id=user.id,
                    leave_type_id=leave_type.id,
                    total=leave_type.yearly_quota,
                    used=0,
                    remaining=leave_type.yearly_quota,
                    year=current_year
                )
                db.add(balance)
                balance_count += 1
        
        db.commit()
        print(f"   ✅ Created {balance_count} leave balance records")
        
        # ============= SUMMARY =============
        print("\n" + "="*70)
        print("✅ DATABASE SEEDED SUCCESSFULLY!")
        print("="*70)
        print("\n📋 Test User Credentials (all passwords: password123):\n")
        print("🔹 CEO:")
        print("   Email: ceo@m2t-ai.com")
        print("   Name: Nanda Kumar")
        print("   Role: CEO (can approve all leaves)")
        print()
        print("🔹 HR Manager:")
        print("   Email: hr@m2t-ai.com")
        print("   Name: Nandini")
        print("   Role: HR (full system access)")
        print()
        print("🔹 Engineering Manager:")
        print("   Email: manager@m2t-ai.com")
        print("   Name: Sai Kumar")
        print("   Role: Manager (can approve team leaves)")
        print()
        print("🔹 Team Lead:")
        print("   Email: teamlead@m2t-ai.com")
        print("   Name: Pragati Gupta")
        print("   Role: Team Lead (can approve team leaves)")
        print()
        print("🔹 Employees:")
        print("   1. dharun@m2t-ai.com - Dharun")
        print("   2. nikhil@m2t-ai.com - Nikhil")
        print("   3. krishna@m2t-ai.com - Krishna")
        print("   4. sudharsan@m2t-ai.com - Sudharsan")
        print("   5. priyanshu@m2t-ai.com - Priyanshu")
        print("   Role: Employee (can apply for leaves)")
        print()
        print("="*70)
        print("📊 Hierarchy:")
        print("   CEO (Nanda Kumar)")
        print("   ├── HR (Nandini)")
        print("   └── Manager (Sai Kumar)")
        print("       └── Team Lead (Pragati Gupta)")
        print("           ├── Dharun")
        print("           ├── Nikhil")
        print("           ├── Krishna")
        print("           ├── Sudharsan")
        print("           └── Priyanshu")
        print("="*70)
        print("🚀 Backend is ready! Start server with: uvicorn main:app --reload")
        print("📖 API Docs will be at: http://localhost:8000/docs")
        print("="*70)
        
    except Exception as e:
        print(f"\n❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
