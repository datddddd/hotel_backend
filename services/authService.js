const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const authRepository = require("../repositories/authRepository");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const validateRegisterInput = ({ user_name, email, password }) => {
  if (!user_name || !password || !email) {
    return "Thiếu thông tin đăng ký!";
  }
  if (password.length < 6) {
    return "Mật khẩu phải có ít nhất 6 ký tự!";
  }
  if (!/\S+@\S+\.\S+/.test(email)) {
    return "Email không hợp lệ!";
  }
  return null;
};

const register = async ({ user_name, email, password }) => {
  const validationError = validateRegisterInput({ user_name, email, password });
  if (validationError) {
    return { badRequest: validationError };
  }

  const existingUser = await authRepository.getUserByEmail(email);
  if (existingUser) {
    return { badRequest: "Email này đã được đăng ký. Vui lòng dùng email khác!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await authRepository.createUser({
    user_name,
    email,
    password: hashedPassword,
    role_user: "user",
  });

  return { success: true };
};

const login = async ({ email, password }) => {
  const user = await authRepository.getUserByEmail(email);
  if (!user) {
    return { notFound: true };
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return { invalidPassword: true };
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role_user,
      user_name: user.user_name,
      email: user.email,
    },
    process.env.JWT_SECRET || "SECRET_KEY",
    { expiresIn: "1h" }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.user_name,
      role: user.role_user,
    },
  };
};

const googleLogin = async ({ credential }) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await authRepository.getUserByEmail(email);

    if (!user) {
      // Create new user if doesn't exist
      await authRepository.createUser({
        user_name: name,
        email: email,
        password: await bcrypt.hash(googleId, 10), // Random password for google users
        role_user: "user",
      });
      user = await authRepository.getUserByEmail(email);
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role_user,
        user_name: user.user_name,
        email: user.email,
      },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "24h" }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.user_name,
        role: user.role_user,
      },
    };
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw new Error("Xác thực Google thất bại");
  }
};

module.exports = {
  register,
  login,
  googleLogin,
};
