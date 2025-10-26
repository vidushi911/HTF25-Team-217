const express = require('express');
const Reminder = require('../models/Reminder');

const router = express.Router();

// @route   GET /api/reminders/:uid
// @desc    Get all reminders for a user
router.get('/:uid', async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.params.uid }).sort({ dateTime: 1 });
    res.json(reminders);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/reminders/add
// @desc    Add new reminder
router.post('/add', async (req, res) => {
  try {
    const { userId, message, dateTime, type } = req.body;

    const newReminder = new Reminder({
      userId,
      message,
      dateTime,
      type: type || 'other'
    });

    const savedReminder = await newReminder.save();
    res.json(savedReminder);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/reminders/delete/:id
// @desc    Delete a reminder
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedReminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!deletedReminder) {
      return res.status(404).json({ msg: 'Reminder not found' });
    }
    res.json({ msg: 'Reminder deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
