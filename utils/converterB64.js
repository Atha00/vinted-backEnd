const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const test = "idfbhpsihqvoibhvldfbvp";

module.exports = { convertToBase64, test };

// module.exports = convertToBase64;
