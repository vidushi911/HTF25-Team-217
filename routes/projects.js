const express = require('express');
const Project = require('../models/Project');

const router = express.Router();

// @route   GET /api/projects/:uid
// @desc    Get all projects for a user
router.get('/:uid', async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.uid }).sort({ deadline: 1 });
    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/projects/add
// @desc    Create new project
router.post('/add', async (req, res) => {
  try {
    const { userId, name, description, deadline, milestones } = req.body;

    const newProject = new Project({
      userId,
      name,
      description,
      deadline,
      milestones: milestones || []
    });

    const savedProject = await newProject.save();
    res.json(savedProject);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/projects/update/:id
// @desc    Update project progress
router.patch('/update/:id', async (req, res) => {
  try {
    const { progress, milestones, name, description, deadline } = req.body;
    
    const updateFields = {};
    if (progress !== undefined) updateFields.progress = progress;
    if (milestones) updateFields.milestones = milestones;
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (deadline) updateFields.deadline = deadline;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    res.json(updatedProject);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/projects/delete/:id
// @desc    Delete a project
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);
    if (!deletedProject) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    res.json({ msg: 'Project deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
