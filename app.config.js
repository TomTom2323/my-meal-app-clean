import 'dotenv/config';

export default {
  expo: {
    name: "MyMealApp",
    slug: "mymealapp",
    version: "1.0.0",
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  },
};