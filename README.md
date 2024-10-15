
# **NewsLens**

NewsLens is a Chrome extension that provides users with insightful information about the political bias of news articles they are reading and suggests related articles based on the content. It helps users navigate media bias and identify diverse perspectives, promoting a more balanced view of current events.

## **Features**

**Political Bias Analysis:** Automatically identifies the political bias of the active article's publicator using data from the Media Bias Fact Check API.

**Related Articles Suggestion:** Recommends articles discussing the same or similar topic, coming from publications across the political bias spectrum. Using NewsCatcher API (https://www.newscatcherapi.com/).

**Bias Visualization:** Presents the bias data in a clean, user-friendly UI with a color-coded bias indicator (e.g., Left, Right, Center, etc). Related articles will be marked with the bias and other metrics.

Note: the below images reflect current progress so far, not final output

<img width="1261" alt="Screenshot 2024-10-03 at 1 13 33 PM" src="https://github.com/user-attachments/assets/a0df9c37-5785-49f6-bf5d-2892c34a4125">
<img width="1192" alt="Screenshot 2024-10-03 at 1 12 59 PM" src="https://github.com/user-attachments/assets/a82818df-9012-4f22-ac44-89fd97ab7435">

To try for yourself:

in the terminal, cd into extension_frontend and run "npm install" 
after any changes to code in this folder, use command "npm run build" 

Go to chrome://extensions/ in your browser, and toggle to Developer Mode 
Click Load Unpacked, and select the "dist" folder within extension_frontend

in another terminal, cd into backend and start virtual environment with command: source venv/bin/activate

install dependencies with pip install -r requirements.txt

start server with command: uvicorn main:app --reload





