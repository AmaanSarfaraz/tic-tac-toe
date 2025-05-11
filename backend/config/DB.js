import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error(`error connecting database, error: ${error.message}`);
  }
};
