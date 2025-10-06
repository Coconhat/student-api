import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Helper function to validate student data
function isValid(object) {
  if (!object) return false;

  const email = object.email_address;
  if (!email) return false;

  if (email.length === 0) return false;

  return true;
}

async function getStudentInfo(id) {
  const api = "https://portal.dlsl.edu.ph/registration/event/helper.php";

  const regKey = process.env.REG_KEY;

  try {
    const response = await fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        action: "registration_tapregister",
        regKey: regKey,
        card_tag: id,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching student info:", error);
    throw error;
  }
}

// Student info endpoint
app.get("/api/student", async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: "Missing id parameter" });
    }

    // Check if id is a tag (contains letters) or student id (numbers only)
    const isTag = /[a-zA-Z]/.test(id);

    const student = await getStudentInfo(id);

    if (isValid(student)) {
      return res.json(student);
    } else {
      return res.status(404).json({ error: "Student not found" });
    }
  } catch (error) {
    console.error("Error in /api/student:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "DLSL Student API Server",
    endpoints: {
      student: "/api/student?id={studentId or cardTag}",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
