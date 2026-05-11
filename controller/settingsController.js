const user = require('../models/user');

// GET all users
const getUser = async (req, res) => {
  try {
    const UserData = await user.find();
    res.status(200).json(UserData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// POST: Add new user
const addUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Create new user
    const newUser = await user.create({ username, password });

    res.status(201).json({ message: 'User created successfully', data: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// DELETE user by ID
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await user.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// UPDATE user by ID
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const updatedUser = await user.findByIdAndUpdate(id, { username, password }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', data: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

module.exports = { getUser, addUser, deleteUser, updateUser };
