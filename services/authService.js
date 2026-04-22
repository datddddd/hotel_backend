const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepository = require("../repositories/authRepository");

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
    "SECRET_KEY",
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

module.exports = {
  register,
  login,
};
