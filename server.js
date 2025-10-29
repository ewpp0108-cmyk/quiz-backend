// server.js (Backend for 2-Level Quiz App - Query Params Added)

// --- 1. Load Libraries ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- 2. Create Express App & Set Port ---
const app = express();
const port = 3000;

// --- 3. Database Connection ---
// [!!!] Replace with your actual MongoDB Atlas connection string!
const dbURI = 'mongodb+srv://ewpp0108_db_user:4Ptrk3KjZK4C2sdp@quizcluster.ef5ytuh.mongodb.net/quizAppDB?appName=QuizCluster';

mongoose.connect(dbURI)
  .then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));
// --- Database Connection End ---

// --- 4. Mongoose Schemas & Models (2-Level Category) ---
const problemSchema = new mongoose.Schema({
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  problem: { type: String, required: true },
  translation: String,
  image: String,
}, { timestamps: true });

const resultSchema = new mongoose.Schema({
  user: { type: String, required: true },
  mainCategory: { type: String, required: true },
  subCategory: { type: String, required: true },
  score: { type: Number, required: true },
  wrongSentenceCount: { type: Number },
  totalCount: { type: Number },
  attemptedCount: { type: Number },
  wrongAnswers: [{
      _id: false, // Prevent _id generation for subdocuments
      problem: { type: String },
      userAnswer: { type: String },
      correctAnswer: { type: String },
      type: { type: String }
  }],
  status: { type: String },
}, { timestamps: true });

const Problem = mongoose.model('Problem', problemSchema);
const Result = mongoose.model('Result', resultSchema);
// --- Schemas & Models End ---

// --- 5. Middleware ---
app.use(cors());
app.use(express.json());
// --- Middleware End ---

// --- 6. Basic Route ---
app.get('/', (req, res) => {
  res.send('퀴즈 백엔드 서버입니다! 🍳 (2단계 카테고리)');
});

// --- 7. API Endpoints ---

// [Create] Add a new problem
app.post('/api/problems', async (req, res) => {
  try {
    const newProblemData = req.body;
    if (!newProblemData.mainCategory || !newProblemData.subCategory || !newProblemData.problem) {
        return res.status(400).json({ message: 'mainCategory, subCategory, and problem are required.' });
    }
    const problem = new Problem(newProblemData);
    await problem.save();
    res.status(201).json(problem);
  } catch (err) {
    console.error("Error saving problem:", err);
    res.status(500).json({ message: 'Error saving problem' });
  }
});

// [Read] Get all problems
app.get('/api/problems', async (req, res) => {
  try {
    const problems = await Problem.find().sort({ mainCategory: 1, subCategory: 1 });
    res.json(problems);
  } catch (err) {
    console.error("Error fetching problems:", err);
    res.status(500).json({ message: 'Error fetching problems' });
  }
});

// [Update] Modify a specific problem by its _id
app.put('/api/problems/:id', async (req, res) => {
  try {
    const problemId = req.params.id;
    const updatedData = req.body;
    const updatedProblem = await Problem.findByIdAndUpdate(problemId, updatedData, { new: true });
    if (!updatedProblem) { return res.status(404).json({ message: 'Problem not found.' }); }
    res.json(updatedProblem);
  } catch (err) {
    console.error("Error updating problem:", err);
    res.status(500).json({ message: 'Error updating problem' });
  }
});

// [Delete] Remove a specific problem by its _id
app.delete('/api/problems/:id', async (req, res) => {
  try {
    const problemId = req.params.id;
    const deletedProblem = await Problem.findByIdAndDelete(problemId);
    if (!deletedProblem) { return res.status(404).json({ message: 'Problem not found.' }); }
    res.json({ message: 'Problem deleted successfully.' });
  } catch (err) {
    console.error("Error deleting problem:", err);
    res.status(500).json({ message: 'Error deleting problem' });
  }
});

// [Delete All] Remove all problems
app.delete('/api/problems/all', async (req, res) => {
    try {
        await Problem.deleteMany({});
        res.json({ message: 'All problems deleted successfully.' });
    } catch (err) {
        console.error("Error deleting all problems:", err);
        res.status(500).json({ message: 'Error deleting all problems' });
    }
});

// [Create] Save a new quiz result
app.post('/api/results', async (req, res) => {
  try {
    const newResultData = req.body;
    console.log("--- Received Result Data ---"); // Keep debug log for now
    console.log(JSON.stringify(newResultData, null, 2));
    console.log("--- End Received Data ---");
    if (!newResultData.user || !newResultData.mainCategory || !newResultData.subCategory || newResultData.score === undefined) {
        return res.status(400).json({ message: 'Required result fields missing.' });
    }
    const result = new Result(newResultData);
    await result.save();
    res.status(201).json(result);
  } catch (err) {
    console.error("결과 저장 오류:", JSON.stringify(err, null, 2)); // Log full error
    res.status(500).json({ message: '결과 저장 중 오류 발생' });
  }
});

// [Read] Get results - [!!!] MODIFIED TO SUPPORT QUERY PARAMS vvv
app.get('/api/results', async (req, res) => {
  try {
    // Get filter conditions from query parameters (e.g., /api/results?user=John)
    const { user, mainCategory, subCategory } = req.query;
    let query = {}; // Start with an empty query (finds all)

    // Add conditions to the query object if they exist
    if (user) query.user = user;
    if (mainCategory) query.mainCategory = mainCategory;
    if (subCategory) query.subCategory = subCategory;

    // Find results matching the query, sort by creation date descending
    const results = await Result.find(query).sort({ createdAt: -1 });

    res.json(results); // Send back the found results (could be an empty array)
  } catch (err) {
    console.error("결과 조회 오류:", err);
    res.status(500).json({ message: '결과 조회 중 오류 발생' });
  }
});
// [!!!] MODIFIED TO SUPPORT QUERY PARAMS ^^^

// [Delete All] Remove all results
app.delete('/api/results/all', async (req, res) => {
    try {
        await Result.deleteMany({});
        res.json({ message: 'All results deleted successfully.' });
    } catch (err) {
        console.error("Error deleting all results:", err);
        res.status(500).json({ message: 'Error deleting all results' });
    }
});

// --- API Endpoints End ---

// --- 8. Start Server ---
app.listen(port, () => {
  console.log(`🚀 서버가 http://localhost:${port} 에서 실행 중입니다.`);
});