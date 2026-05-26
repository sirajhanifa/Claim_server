const User = require('../models/user');

// -----------------------------------------------------------------------------------------------------------------

// GET all users

const getUser = async (req, res) => {
    try {
        const UserData = await User.find();
        res.status(200).json(UserData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// POST: Add new user

const addUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        const newUser = await User.create({ username, password, role });
        res.status(201).json({ message: 'User created successfully', data: newUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create user' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// DELETE user by ID

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) { return res.status(404).json({ message: 'User not found' }) }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// UPDATE user by ID

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role } = req.body;
        if (!username || !password) { return res.status(400).json({ message: 'Username and password are required' }) }
        const updatedUser = await User.findByIdAndUpdate(id, { username, password, role }, { new: true });
        if (!updatedUser) { return res.status(404).json({ message: 'User not found' }) }
        res.status(200).json({ message: 'User updated successfully', data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update user' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

// CHANGE password

const changePassword = async (req, res) => {

    try {

        const { username, currentPassword, newPassword } = req.body;
        if (!username || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.password !== currentPassword) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to change password' });
    }
};

// -----------------------------------------------------------------------------------------------------------------

module.exports = { getUser, addUser, deleteUser, updateUser, changePassword };