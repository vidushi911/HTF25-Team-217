const express = require('express');
const Assignment = require('../models/Assignment');

const router = express.Router();

// @route   GET /api/assignments/:uid
// @desc    Get all assignments for a user
router.get('/:uid', async (req, res) => {
  try {
    const assignments = await Assignment.find({ userId: req.params.uid }).sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/assignments/add
// @desc    Create new assignment
router.post('/add', async (req, res) => {
  try {
    const { userId, title, subject, dueDate, description } = req.body;

    const newAssignment = new Assignment({
      userId,
      title,
      subject,
      dueDate,
      description
    });

    const savedAssignment = await newAssignment.save();
    res.json(savedAssignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/assignments/update/:id
// @desc    Update assignment status or due date
router.patch('/update/:id', async (req, res) => {
  try {
    const { completed, dueDate, title, description } = req.body;
    
    const updateFields = {};
    if (completed !== undefined) updateFields.completed = completed;
    if (dueDate) updateFields.dueDate = dueDate;
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }

    res.json(updatedAssignment);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/assignments/delete/:id
// @desc    Delete an assignment
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedAssignment = await Assignment.findByIdAndDelete(req.params.id);
    if (!deletedAssignment) {
      return res.status(404).json({ msg: 'Assignment not found' });
    }
    res.json({ msg: 'Assignment deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
