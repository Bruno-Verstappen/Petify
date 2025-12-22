import { Outlet } from "react-router-dom";
import Header from "./Header";



export default function MainLayout(){
    return(
        <>
        <div className="container-fluid">
        <Header/>
        <main className="container my-4">
            <Outlet/>
        </main>
  
        </div>
        </>
)};