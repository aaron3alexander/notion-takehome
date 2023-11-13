# Description:

My program works by first parsing the CSV file and simultaenously eliminating the duplicate reviews. After that, it connects to the Notion database and clears each page in it.

Then, it loops through the parsed data and calculates the total number of stars and reviews for each book, along with the number of favorites. It stores this new data in a map.

Finally, it loops through the map, calculates the average rating, and creates new pages under the database.

## How to Run:

1.  `cd` into the root folder
2.  Run `npm install`
3.  Create a `.env` file that has:

- `NOTION_KEY=`your Notion API key
- `NOTION_DB_ID=`your Notion database ID

4. Run `node index.js`

# Short Answers

#### Anything I got stuck on?

- Accounting for duplicate reviews. My approach was to use a hashmap and to override the key-value each time a duplicate review was found. However, I made my key an array, and if an array is compared to an identical array, it returns false instead of true. I found this error by adding a ton of console.log statements and slowly narrowed my scope down until I found the root of the problem.

#### Areas of improvement for the API docs?

- For the database `update` api, include an example of how it would be done with the Notion SDK. Every other database API has an SDK example, but the `update` one uses Axios. Other than this, the docs are pretty good.

# Resources I used:

Stack overflow title case thread: https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript

- used this to convert my strings into title case when pushing to the database

# Packages I installed:

- dotenv: installed this because my environmental variables weren't accessible unless I manually configured the file path
