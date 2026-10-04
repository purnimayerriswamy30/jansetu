import os

from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app)

# MySQL Database Configuration
DB_CONFIG = {
    "host": os.environ.get("MYSQL_HOST"),
    "port": int(os.environ.get("MYSQL_PORT", "3306")),
    "user": os.environ.get("MYSQL_USER"),
    "password": os.environ.get("MYSQL_PASSWORD"),
    "database": os.environ.get("MYSQL_DATABASE"),
}
# Reusable database connection
def get_db_connection():
    return mysql.connector.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database="defaultdb",
    )
# Home Route
@app.route("/")
def home():
    return jsonify({
        "project": "JanSetu",
        "message": "JanSetu backend is running successfully!"
    })


# Test Database 
@app.route("/api/db-test")
def db_test():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Explicitly select the Aiven database
        cursor.execute("USE defaultdb")

        # Confirm which database is currently selected
        cursor.execute("SELECT DATABASE()")
        database = cursor.fetchone()[0]

        # Check tables
        cursor.execute("SHOW TABLES")
        tables = [row[0] for row in cursor.fetchall()]

        return jsonify({
            "success": True,
            "database": database,
            "tables": tables
        })

    except Error as e:
        return jsonify({
            "success": False,
            "message": "Database connection failed",
            "error": str(e)
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


# Health Check
@app.route("/api/health")
def health():
    return jsonify({
        "success": True,
        "message": "JanSetu API connected"
    })


# Register a new resident
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    role = str(data.get("role", "resident")).strip().lower()

    if role not in {"resident", "authority"}:
        return jsonify({
            "success": False,
            "message": "Invalid account role"
        }), 400

    if not name or not email or not isinstance(password, str) or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "message": "Password must be at least 8 characters"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Store the selected account role. The database schema must allow
        # both `resident` and `authority`; this endpoint does not attempt
        # to alter the schema automatically because the database user may
        # intentionally not have ALTER TABLE permission.
        password_hash = generate_password_hash(password)

        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
            """,
            (name, email, password_hash, role)
        )
        connection.commit()

        return jsonify({
            "success": True,
            "message": f"{role.title()} account created successfully",
            "role": role
        }), 201

    except mysql.connector.IntegrityError:
        return jsonify({
            "success": False,
            "message": "This email is already registered"
        }), 409

    except Error as exc:
        app.logger.exception("Registration failed")

        if role == "authority":
            return jsonify({
                "success": False,
                "message": "Authority registration failed. Your database users.role column must allow 'authority'.",
                "detail": str(exc)
            }), 500

        return jsonify({
            "success": False,
            "message": "Registration failed. Please try again."
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


# Login with email and password
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    password = data.get("password", "")
    expected_role = str(data.get("expected_role", "")).strip().lower()

    if expected_role not in {"resident", "authority"}:
        expected_role = ""

    if not email or not isinstance(password, str) or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, name, email, password_hash, role
            FROM users
            WHERE email = %s
            """,
            (email,)
        )
        user = cursor.fetchone()

        if not user or not check_password_hash(
            user["password_hash"], password
        ):
            return jsonify({
                "success": False,
                "message": "Invalid email or password"
            }), 401

        # The role selected on the login screen must match the role stored
        # for this account. This prevents an authority account from opening
        # the resident workspace (and vice versa).
        if expected_role and user["role"].lower() != expected_role:
            return jsonify({
                "success": False,
                "message": f"This account is registered as {user['role']}. Please use the correct login."
            }), 403

        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"]
            }
        }), 200

    except Error:
        app.logger.exception("Login failed")
        return jsonify({
            "success": False,
            "message": "Login failed. Please try again."
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


# Get complaints for a specific user
# Get complaints for a specific user OR save a new complaint
@app.route("/api/complaints", methods=["GET", "POST"])
def get_complaints():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # POST: Save a new complaint
        if request.method == "POST":
            data = request.get_json(silent=True) or {}

            user_id = data.get("user_id")
            title = str(data.get("title", "")).strip()
            description = str(data.get("description", "")).strip()
            category = str(data.get("category", "Other")).strip()
            location = str(data.get("location", "")).strip()
            severity = str(data.get("severity", "Medium")).strip()

            if not user_id or not title or not description:
                return jsonify({
                    "success": False,
                    "message": "User ID, title and description are required"
                }), 400

            # Confirm the user exists
            cursor.execute(
                "SELECT id FROM users WHERE id = %s",
                (user_id,)
            )
            if not cursor.fetchone():
                return jsonify({
                    "success": False,
                    "message": "User not found"
                }), 404

            # Generate a unique complaint reference
            import uuid
            reference_no = "JS-" + uuid.uuid4().hex[:8].upper()

            cursor.execute(
                """
                INSERT INTO complaints
                (user_id, reference_no, title, description,
                 category, location, severity, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    reference_no,
                    title,
                    description,
                    category,
                    location,
                    severity,
                    "Submitted"
                )
            )

            connection.commit()

            return jsonify({
                "success": True,
                "message": "Complaint saved successfully",
                "complaint_id": cursor.lastrowid,
                "reference_no": reference_no
            }), 201

        # GET: Fetch complaints for a user
        user_id = request.args.get("user_id", type=int)

        if not user_id or user_id < 1:
            return jsonify({
                "success": False,
                "message": "A valid user_id is required"
            }), 400

        cursor.execute(
            """
            SELECT id, reference_no, title, description,
                   category, location, severity, status, created_at
            FROM complaints
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user_id,)
        )

        complaints = cursor.fetchall()

        for complaint in complaints:
            if complaint.get("created_at"):
                complaint["created_at"] = (
                    complaint["created_at"].isoformat()
                )

        return jsonify({
            "success": True,
            "complaints": complaints
        }), 200

    except Error:
        if connection is not None and connection.is_connected():
            connection.rollback()

        app.logger.exception("Complaint operation failed")
        return jsonify({
            "success": False,
            "message": "Could not save or fetch complaint. Check backend terminal."
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()

# Get all complaints for the authority dashboard
@app.route("/api/authority/complaints", methods=["GET"])
def authority_complaints():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                c.id, c.reference_no, c.title, c.description,
                c.category, c.location, c.severity, c.status,
                c.progress_note, c.created_at,
                u.name AS resident_name, u.email AS resident_email
            FROM complaints c
            JOIN users u ON u.id = c.user_id
            ORDER BY c.created_at DESC
        """)

        rows = cursor.fetchall()

        for row in rows:
            if row.get("created_at"):
                row["created_at"] = row["created_at"].isoformat()

        return jsonify({
            "success": True,
            "complaints": rows
        }), 200

    except Error:
        app.logger.exception("Could not fetch authority complaints")
        return jsonify({
            "success": False,
            "message": "Could not fetch complaints"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()


# Update a complaint's status and progress
@app.route(
    "/api/authority/complaints/<int:complaint_id>/status",
    methods=["PUT"]
)
def update_authority_complaint(complaint_id):
    data = request.get_json(silent=True) or {}

    status = str(data.get("status", "")).strip()
    progress_note = str(data.get("progress_note", "")).strip()

    allowed_statuses = {
        "Under Review",
        "Accepted",
        "In Progress",
        "Resolved",
        "Rejected"
    }

    if status not in allowed_statuses:
        return jsonify({
            "success": False,
            "message": "Invalid complaint status"
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE complaints
            SET status = %s, progress_note = %s
            WHERE id = %s
        """, (status, progress_note or None, complaint_id))

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT id FROM complaints WHERE id = %s",
                (complaint_id,)
            )
            if not cursor.fetchone():
                return jsonify({
                    "success": False,
                    "message": "Complaint not found"
                }), 404

        connection.commit()

        return jsonify({
            "success": True,
            "message": "Complaint status and progress updated"
        }), 200

    except Error:
        if connection is not None and connection.is_connected():
            connection.rollback()

        app.logger.exception("Complaint update failed")
        return jsonify({
            "success": False,
            "message": "Could not update complaint"
        }), 500

    finally:
        if cursor is not None:
            cursor.close()
        if connection is not None and connection.is_connected():
            connection.close()
# Run Flask Application
if __name__ == "__main__":
    app.run(debug=True)
