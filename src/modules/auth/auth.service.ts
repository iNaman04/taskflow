import prisma from "../../config/db";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt";

interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export const registerUser = async (data: RegisterInput) => {

    const { name, email, password } = data;

    // Check whether user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
        data: {
            name,
            email,
            passwordHash
        }
    });

    // Generate JWT
    const token = generateToken(user.id);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        },
        token
    };
};



export const loginUser = async (
    email: string,
    password: string
) => {

    // Find user
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Compare password with stored hash
    const isPasswordValid = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // Generate JWT
    const token = generateToken(user.id);

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        },
        token
    };
};