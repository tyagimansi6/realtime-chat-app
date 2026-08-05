const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendResetEmail, sendWelcomeEmail } = require("../services/mailService");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = ({ User, PasswordResetToken }) => ({

    registerUser: async (req, res) => {
        const { username, email, password } = req.body;
        if (!(username && email && password)) return res.status(400).json({ status: "Missing Data" });

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({ username, email, password: hashedPassword });

            const mailResult = await sendWelcomeEmail(email, username);


            const newUser = user.toObject();
            delete newUser.password;
            delete newUser.email;
            req.io.emit("newUserCreated",newUser);
            // req.io.emit("test","Hello");
            res.status(201).json({
                timeStamp: new Date(),
                status: "Registered successfully",
                user: { id: user._id, username, email },
                emailStatus: mailResult.success
            });
        } catch (err) {
            console.error("Register error:", err.message);
            res.status(500).json({ error: err.message });
        }
    },

    loginUser: async (req, res) => {
        const { username, password } = req.body;
        if (!(username && password)) return res.status(400).json({ error: "Missing credentials" });

        const user = await User.findOne({ username });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'None', maxAge: 3600000 });
        res.status(200).json({ status: "Login successful" });
    },

    sendResetMail: async (req, res) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ status: "Missing Data" });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ error: "Invalid email" });

        await PasswordResetToken.deleteMany({ userId: user._id });
        const token = crypto.randomBytes(32).toString("hex");
        await PasswordResetToken.create({ userId: user._id, token });

        const emailResult = await sendResetEmail(email, token);
        res.status(200).json({
            timeStamp: new Date(),
            success: emailResult.success,
            status: emailResult.success ? "Reset link sent." : "Failed to send reset link."
        });
    },

    resetPassword: async (req, res) => {
        const { token, email, newPassword } = req.body;
        if (!(token && email && newPassword)) return res.status(400).json({ status: "Missing Data" });

        const tokenDoc = await PasswordResetToken.findOne({ token });
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!tokenDoc || !user) return res.status(401).json({ error: "Invalid token/email" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        await PasswordResetToken.deleteMany({ userId: user._id });

        res.status(200).json({ timeStamp: new Date(), status: "Password reset successful", success: true });
    },

    validateUser: async (req, res) => {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ status: "Invalid token" });

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id).select("_id username email");
            if (!user) return res.status(401).json({ status: "Invalid token", success: false });

            res.status(200).json({ timeStamp: new Date(), status: "Token is valid", success: true, user });
        } catch (err) {
            console.error("Validation error:", err.message);
            res.status(401).json({ status: "Invalid token", success: false, error: err.message });
        }
    },

    logOut: async (req, res) => {
        res.clearCookie('token');
        res.status(200).json({ status: "Logged out successfully" });
    }

});
