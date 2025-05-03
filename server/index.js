import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import {signUp, login} from "./contollers/auth.js";
import { addPost, getPostById, getPostsByCategoryTitle, getPublicPosts, getPosts, deletePostById, updatePostById} from "./contollers/posts.js";
import { isAdmin } from "./utils/helper.js";
import { editUserById, getAllUsers, getUserById, deleteUserById } from "./contollers/users.js";
import { addCategory, getCategoriesTitle, deleteCategoryById, editCategoryById, getCategoryById, getCategories } from "./contollers/categories.js";
import { getCommentsByPostId, increment_View_ByPostId, increment_Like_ByPostId, addComment_updatePost_ByPostId ,deleteCommentById } from "./contollers/interactions.js";
import { getProfileById, updateProfileById } from "./contollers/profile.js";


const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload({ useTempFiles: true }));



app.post("/signup", signUp);

app.post("/login", login);



app.post("/add-post", addPost);  

app.get("/get-publicPosts", getPublicPosts);

app.get("/get-posts", getPosts);

app.get("/get-post/:id", getPostById);

app.delete("/delete-post/:id", deletePostById);

app.put("/update-post/:id", updatePostById);



app.post("/users", isAdmin, getAllUsers);

app.post("/users/:id", isAdmin, getUserById);

app.put("/users/:id", isAdmin, editUserById);

app.delete("/users/:id", isAdmin, deleteUserById);



app.get("/categories", getCategories);

app.get("/categories/:id", getCategoryById);

app.post("/add-category", addCategory);

app.put("/edit-category/:id", editCategoryById);

app.delete("/delete-category/:id", deleteCategoryById);

app.get("/get-categories", getCategoriesTitle);



app.post("/api/posts/:id/view", increment_View_ByPostId);

app.post("/api/posts/:id/like", increment_Like_ByPostId);

app.get("/api/posts/:id/comments"  , getCommentsByPostId);

app.post("/api/posts/:id/comments", addComment_updatePost_ByPostId);

app.delete("/api/comments/:commentId", deleteCommentById);

app.get("/get-posts/:category_title", getPostsByCategoryTitle);    



app.get("/user-profile/:userId", getProfileById);

app.post("/update-profile", updateProfileById);



// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});



