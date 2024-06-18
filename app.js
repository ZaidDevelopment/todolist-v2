//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// mongodb+srv://zachlee:zee.Dev.1@cluster0.sdi3ty9.mongodb.net/todolistDB
mongoose.connect("mongodb://127.0.0.1/todolistDB", { useNewUrlParser: true });

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "This is my first item.",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit to delete an item.",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  //Read data
  Item.find({})
    .then(function (foundItems) {
      //Wrtie default items only if collection is empty
      if (foundItems.length === 0) {
        // Save in bulk
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved all items to todolistDB.");
          })
          .catch(function (err) {
            console.log(err);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName })
    .then(function (foundList) {
      if (!foundList) {
        console.log("Didn't exist but now it does");
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list
          .save()
          .then(function () {
            res.redirect("/" + customListName);
          })
          .catch(function (err) {
            console.log(err);
          });
      } else {
        console.log("Exist");
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        console.log("Data deleted"); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(function () {
        console.log("Data deleted"); // Success
      })
      .catch(function (error) {
        console.log(error); // Failure
      });
    res.redirect("/" + listName);
  }
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
