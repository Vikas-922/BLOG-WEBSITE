
import { db } from "../config/firebase.js"; 
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";


// Get All Users
const getAllUsers = async (req, res) => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users", error: error.message });
    }
  };
  
  // Get User by ID
const getUserById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const userDoc = await getDoc(doc(db, "users", id));
      if (!userDoc.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json(userDoc.data());
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error fetching user", error: error.message });
    }
  };
  
  
  // Edit User
const editUserById = async (req, res) => {
    const { id } = req.params;
    const { firstname, lastname, usertype } = req.body;
  
    try {
      const userRef = doc(db, "users", id);
      const userDoc = await getDoc(userRef);
  
      if (!userDoc.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
  
      await updateDoc(userRef, {
        firstname,
        lastname,
        usertype,
        updated_at: new Date().toISOString(),
      });
  
      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user", error: error.message });
    }
  };
  
  // Delete User
  const deleteUserById = async (req, res) => {
    const { id } = req.params;
  
    try {
      const userRef = doc(db, "users", id);
      const userDoc = await getDoc(userRef);
  
      if (!userDoc.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
  
      await deleteDoc(userRef);
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user", error: error.message });
    }
  };


  

  export { getAllUsers, getUserById, editUserById, deleteUserById };