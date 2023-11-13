require("dotenv").config({ path: "./.env" });
const fs = require("fs");
const readline = require("readline");
const inStream = fs.createReadStream("ratings.csv");

const { Client } = require("@notionhq/client");

const databaseId = process.env.NOTION_DB_ID;
const notion = new Client({
  auth: process.env.NOTION_KEY,
});

function readCSVFile(fileName) {
  //function that parses the CSV file and eliminates dupe reviews
  return new Promise((resolve, reject) => {
    let data = [];
    const userReviewMap = new Map(); //this hashmap removes dupe reviews

    const inStream = fs.createReadStream(fileName);
    const rl = readline.createInterface({
      //read each line
      input: inStream,
      crlfDelay: Infinity, //makes it so that it needs a \r\n to make a new line, not just \n
    });

    rl.on("line", (line) => {
      //parse the data
      const fields = line.split(",");
      let key =
        fields[0].trim().toLowerCase() + "," + fields[1].trim().toLowerCase(); // key = "title,author"

      userReviewMap.set(key, Number(fields[2])); //if there is a duplicate review, it will be overridden with the most recent one
    });

    rl.on("close", () => {
      data = Array.from(userReviewMap);
      resolve(data); // resolve promise with the parsed data
    });

    rl.on("error", (err) => {
      reject(err); // reject promise if there's an error
    });
  });
}

async function deletePage(id) {
  //function to delete a specific notion page
  try {
    const res = await notion.blocks.delete({
      block_id: id,
    });
  } catch (error) {
    console.error(error);
  }
}

async function createPage(bookTitle, avgRating, numFav) {
  //creates pages under the database

  /*considered an edge case where the titles in the database could change, which would throw an error here.
  Could implement in the future by grabbing the database object and parsing its properties. */
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        "Book Title": {
          type: "title",
          title: [
            {
              type: "text",
              text: {
                content: bookTitle,
              },
            },
          ],
        },
        "Average Rating": {
          type: "number",
          number: avgRating,
        },
        "Num Favorites": {
          type: "number",
          number: numFav,
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
}

function toTitleCase(str) {
  //converts strings to title case
  //ripped from https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

(async () => {
  try {
    const data = await readCSVFile("ratings.csv");

    const deleteCurrentPages = await notion.databases.query({
      //clean database up
      database_id: databaseId,
    });
    deleteCurrentPages["results"].forEach((element) => {
      deletePage(element["id"]);
    });

    let bookData = new Map(); // hashmap that will hold all of the books and their data

    for (const row of data) {
      //loop through parsed data. Calculate total rating, number of reviewers, favorites
      const temp = row[0].split(",");
      const title = temp[0];
      let thisRating = row[1];

      let isFav = 0;
      if (thisRating === 5) isFav = 1;

      if (!bookData.has(title)) {
        bookData.set(title, [thisRating, 1, isFav]);
      } else {
        const currData = bookData.get(title);

        let totalStars = currData[0];
        let totalReviewers = currData[1];
        let numFavorites = currData[2];

        bookData.set(title, [
          totalStars + thisRating,
          ++totalReviewers,
          numFavorites + isFav,
        ]);
      }
    }

    for (const key of bookData.keys()) {
      //loop through the data, calculate the average rating, and create pages
      const currData = bookData.get(key);

      let totalStars = currData[0];
      let totalReviewers = currData[1];

      const avgRating = Number((totalStars / totalReviewers).toFixed(1));
      const numFavorites = currData[2];
      const title = toTitleCase(key);

      createPage(title, avgRating, numFavorites);
    }
  } catch (error) {
    console.error("Error: ", error);
  }
})();
