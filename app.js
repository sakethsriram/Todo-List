const express = require("express");
const ejs = require("ejs");
const date = require(__dirname + "/date");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todoListDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const listSchema = mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", listSchema);
const item1 = new Item({
  name: "Welcome to the ToDo List"
});
const item2 = new Item({
  name: "hit + button to add the new task"
});
const item3 = new Item({
  name: "<== hit this button to delete a task"
});

const defaultItems = [item1, item2, item3];

const customListSchema = mongoose.Schema({
  name: String,
  items: [listSchema]
});

const customList = mongoose.model("list", customListSchema);

app.get("/", function(req, res) {
  Item.find(function(err, items) {
    if (!err) {
      if (items.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err)
            console.log(err);
        });
        res.redirect("/");
      } else {
        res.render('list', {
          listTitle: "Home",
          tasks: items
        });
      }
    }
  });
});

app.use(express.urlencoded({
  extended: false
}));
app.post("/", function(req, res) {
  const taskName = req.body.newItem;
  const listTitle = _.lowerCase(req.body.name);
  const newTask = new Item({
    name: taskName
  });
  if (listTitle === "home") {
    newTask.save();
    res.redirect("/");
  } else {
    customList.updateOne({
      name: listTitle
    }, {
      $push: {
        items: new Item({
          name: taskName
        })
      }
    }, function(err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/" + listTitle);
  }
});

app.post("/delete", function(req, res) {
  const id = req.body.checkbox;
  const listTitle = _.lowerCase(req.body.name);
  if (listTitle === "home") {
    Item.findByIdAndDelete(id, function(err) {
      if (err)
        console.log(err);
    });
    res.redirect("/");
  } else {
    customList.updateOne({
      name: listTitle
    }, {
      $pull: {
        items: {
          _id: id
        }
      }
    }, function(err) {
      if (err) {
        console.log(err);
      }
    });
    res.redirect("/" + listTitle);
  }

});

app.get("/:list", function(req, res) {
  const listName = _.lowerCase(req.params.list);
  customList.findOne({
    name: listName
  }, function(err, result) {
    if (!err) {
      if (!result) {
        const listItem = new customList({
          name: listName,
          items: defaultItems
        });
        listItem.save();
        res.redirect("/" + listName);
      } else {
        res.render("list", {
          listTitle: _.capitalize(listName),
          tasks: result.items
        });
      }
    }
  });
});

// app.post()
app.get("/about", function(req, res) {
  res.render("about");
});
app.listen(3000, function() {
  console.log("Server Started on port 3000");
});