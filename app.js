const express = require("express");
const multer = require("multer");
const pdfkit = require("pdfkit");
const fs = require("fs");
const fsPromises = fs.promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 3000;

//configure multer
const upload = multer({ dest: "upload/" });
app.use(express.json({ limit: "10mb" }));

//initialize Google Gemini

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
app.use(express.static("public"));

//routes
//analyze
app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Please upload an image" });
    }

    const imagePath = req.file.path;
    const imageData = await fsPromises.readFile(imagePath, {
      encoding: "base64",
    });

    //use the gemini api to analyze the image

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const result = await model.generateContent([
      "Analyze this car image and provide detailed analysis of the car, model, the brand, the year it was introduced, base price, top speed, engine, build, dimensions, its features, charactreristics and any interesting facts. Please provide the response in plain text without using any markdown formatting",
      {
        inlineData: {
          mimeType: req.file.mimeType,
          data: imageData,
        },
      },
    ]);
    const carInfo = result.response.text();
    //remove the uploaded image
    await fsPromises.unlink(imagePath);
    //send the response
    res.json({
      results: carInfo,
      image: `data:${req.file.mimetype};base64,${imageData}`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//download pdf
app.post("/download", async (req, res) => {
  res.json({ success: true });
});

//start the server
app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
