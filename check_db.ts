import { collection, getDocs } from "firebase/firestore";
import { db } from "./src/lib/firebase/client";

async function check() {
    const sSnap = await getDocs(collection(db, "subjects"));
    console.log("Subjects count:", sSnap.size);
    sSnap.docs.forEach(d => console.log("- ", d.data().name));

    const tSnap = await getDocs(collection(db, "users"));
    const teachers = tSnap.docs.filter(d => d.data().role === "professor");
    console.log("Teachers count:", teachers.length);
    teachers.forEach(d => console.log("- ", d.data().name));
}
// This is just for my reference, I won't run it as a script directly if I can't.
