//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');
const env = require('dotenv').config().parsed;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db_pass = process.env.DB_PASSWORD
mongoose.connect("mongodb+srv://admin-ayaan:"+ db_pass + "@cluster0.eq2sewl.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
})

const Item = mongoose.model('Item', itemsSchema);


// item 1
const item1 = new Item({
  name: "Welcome to your todolist!"
});

// item 2
const item2 = new Item({
  name: "Hit the + button to add a new item."
});

// item 3
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find({}).then(function (foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(console.log("Successfully saved default items to DB!")).catch(err => console.log(err));
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Main List", newListItems: foundItems });
    }
  })

  const day = date.getDate();
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  // TRADITIONAL WAY TAUGHT BY ANGELA
  const item = new Item({
    name: itemName
  });

  if (listName == "Main List") {
    // main list
    item.save();
    res.redirect("/")
  } else {
    // custom list
    List.findOne({name: listName}).then(foundList => {
      foundList.items.push(item);
      foundList.save();
    }).then(() => {
      res.redirect("/" + listName);
    }).catch(err => console.log(err))
    
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkboxId;
  const listName = req.body.listName;

  if (listName === "Main List") {
    // default list
    Item.findByIdAndRemove(checkedItemId).then(res.redirect("/")).catch(err => console.log("An error occured: " + err));
  } else {
    // custom list
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(res.redirect('/' + listName)).catch(err => console.log(err))
  }
})

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName)

  List.findOne({ name: customListName })
    .then(foundList => {
      if (!foundList) {
        // create new list
        const list = List.create({
          name: customListName,
          items: defaultItems
        });
        res.redirect("/" + customListName);
      } else {
        // show existing list

        const day = date.getDate();
        res.render("list", { listTitle: customListName, newListItems: foundList.items });
      }
    })
    .catch(err => console.log(err));
  const list = List.create({
    name: customListName,
    items: defaultItems
  });
})

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
