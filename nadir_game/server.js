const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- رابط الاتصال بـ MongoDB Atlas (تأكد من صحة كلمة المرور) ---
const MONGO_URI = "mongodb+srv://nadir:Daoudi2010@nadir2010.mongodb.net/nadir_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ متصل بسحابة MongoDB Atlas بنجاح!"))
  .catch(err => console.error("❌ فشل الاتصال:", err));

// تعريف شكل بيانات اللاعب
const playerSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 10000 },
  ownedCompanies: { type: Map, of: Number, default: {} }
});

const Player = mongoose.model('Player', playerSchema);

// توليد بيانات الـ 300 شركة في السيرفر لضمان الأمان
const ALL_COMPANIES = Array.from({ length: 300 }, (_, i) => ({
  id: i.toString(),
  name: `شركة نادير #${i + 1}`,
  cost: Math.floor(1000 * Math.pow(1.15, i)),
  income: Math.floor(50 * Math.pow(1.15, i))
}));

// رابط جلب البيانات
app.get('/api/player/:id', async (req, res) => {
  let player = await Player.findOne({ deviceId: req.params.id });
  if (!player) {
    player = new Player({ deviceId: req.params.id });
    await player.save();
  }
  res.json({ player, companies: ALL_COMPANIES });
});

// رابط الشراء
app.post('/api/buy', async (req, res) => {
  const { deviceId, companyId, amount } = req.body;
  const player = await Player.findOne({ deviceId });
  const company = ALL_COMPANIES.find(c => c.id === companyId);

  if (player && company) {
    const totalCost = company.cost * amount;
    if (player.balance >= totalCost) {
      player.balance -= totalCost;
      const currentCount = player.ownedCompanies.get(companyId) || 0;
      player.ownedCompanies.set(companyId, currentCount + amount);
      await player.save();
      return res.json(player);
    }
  }
  res.status(400).json({ error: "فشلت العملية" });
});

app.listen(5000, () => console.log("🚀 السيرفر يعمل على http://localhost:5000"));