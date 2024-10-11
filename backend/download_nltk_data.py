import nltk

# Create and use the local 'nltk_data' directory within your project
nltk.data.path.append("./nltk_data")

# Download the necessary NLTK data files into the specified directory
nltk.download("punkt", download_dir="./nltk_data")
nltk.download("stopwords", download_dir="./nltk_data")

print("NLTK data files downloaded successfully into 'nltk_data' directory.")
