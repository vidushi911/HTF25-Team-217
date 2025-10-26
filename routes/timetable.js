const express = require('express');
const Timetable = require('../models/Timetable');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/timetable/:uid
// @desc    Get user's timetable
router.get('/:uid', async (req, res) => {
  try {
    const timetable = await Timetable.find({ userId: req.params.uid }).sort({ day: 1, time: 1 });
    res.json(timetable);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/timetable/add
// @desc    Add new class to timetable
router.post('/add', async (req, res) => {
  try {
    const { userId, subject, day, time, faculty, room } = req.body;

    const newClass = new Timetable({
      userId,
      subject,
      day,
      time,
      faculty,
      room
    });

    const savedClass = await newClass.save();
    res.json(savedClass);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/timetable/delete/:id
// @desc    Delete a class
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedClass = await Timetable.findByIdAndDelete(req.params.id);
    if (!deletedClass) {
      return res.status(404).json({ msg: 'Class not found' });
    }
    res.json({ msg: 'Class deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
