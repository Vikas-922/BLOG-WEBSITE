
import { db } from "../config/firebase.js"; 
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";



const getCategories = async (req, res) => {
    try {
        const categoriesSnapshot = await getDocs(collection(db, "categories"));
        const categories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
  
        res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Failed to fetch categories." });
    }
  };


// Route to fetch all categories
const getCategoriesTitle = async (req, res) => {
  try {
      const categorySnapshot = await getDocs(collection(db, "categories"));
      const categories = categorySnapshot.docs.map(doc => {
          return { description: doc.data().description, title: doc.data().title }; // Assuming you have a `title` field in the categories collection
      });

      res.status(200).json(categories);
  } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Error fetching categories." });
  }
};

  
  // Get Single Category
const getCategoryById = async (req, res) => {
    const { id } = req.params;
  
    try {
        const categoryRef = doc(db, "categories", id);
        const categoryDoc = await getDoc(categoryRef);
  
        if (!categoryDoc.exists()) {
            return res.status(404).json({ message: "Category not found." });
        }
  
        res.status(200).json({ id: categoryDoc.id, ...categoryDoc.data() });
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ message: "Failed to fetch category." });
    }
  };
  
  
  // Add Category Route
const addCategory = async (req, res) => {
    const { title, description } = req.body;
  
    try {
      // Validate input
      if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required." });
      }
  
      const categoryId = doc(collection(db, "categories")).id;
    
      await setDoc(doc(db, "categories", categoryId), {
        title,
        description,
        created_at: new Date().toISOString(),
      });
  
      res.status(201).json({ message: "Category added successfully.", id: categoryId });
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({ message: "Failed to add category." });
    }
  };
  
  
  // Edit Category Route
const editCategoryById = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
  
    try {
        // Check if the category exists
        const categoryRef = doc(db, "categories", id);
        const categoryDoc = await getDoc(categoryRef);
  
        if (!categoryDoc.exists()) {
            return res.status(404).json({ message: "Category not found." });
        }
  
        // Update category details
        await updateDoc(categoryRef, {
            title,
            description,
            updated_at: new Date().toISOString(),
        });
  
        res.status(200).json({ message: "Category updated successfully." });
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Failed to update category." });
    }
  };
  
  
  // Delete Category Route
const deleteCategoryById = async (req, res) => {
    const { id } = req.params;
  
    try {
        // Check if the category exists
        const categoryRef = doc(db, "categories", id);
        const categoryDoc = await getDoc(categoryRef);
  
        if (!categoryDoc.exists()) {
            return res.status(404).json({ message: "Category not found." });
        }
  
        // Delete the category
        await deleteDoc(categoryRef);
  
        res.status(200).json({ message: "Category deleted successfully." });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Failed to delete category." });
    }
  };
  

export { getCategories, getCategoriesTitle, getCategoryById, addCategory, editCategoryById, deleteCategoryById };