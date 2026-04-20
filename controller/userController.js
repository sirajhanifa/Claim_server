const jwt = require('jsonwebtoken');
const User = require('../models/user');

// -------------------------------------------------------------------------------------------------------------

// Login User Controller

const loginUser = async (req, res) => {

	const { username, password } = req.body;
	const secretKey = process.env.JWT_SECRET;

	try {

		const user = await User.findOne({ username });

		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		if (user.password !== password) {
			return res.status(401).json({ message: 'Incorrect password' });
		}

		const token = jwt.sign({ username: user.username }, secretKey, { expiresIn: '1h' });

		return res.status(200).json({
			message: 'Login successful!',
			token,
			user: {
				id: user._id,
				username: user.username,
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({ message: 'Server error' });
	}
};

// -------------------------------------------------------------------------------------------------------------

module.exports = { loginUser };