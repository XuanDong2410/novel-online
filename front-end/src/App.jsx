import { Routes, Route, Navigate } from "react-router-dom"
import HomePage from "./pages/home/HomePage"
import SignUpPage from "./pages/SignUpPage"
import LogInPage from "./pages/LogInPage"
import Footer from "./components/Footer"
import { Toaster } from "react-hot-toast"
import { useAuthStore } from "./store/authUser"
import { useEffect } from "react"
import { Loader } from "lucide-react"
import WatchPage from "./pages/WatchPage"
import SearchPage from "./pages/SearchPage"
import SearchHistoryPage from "./pages/SearchHistoryPage"
import NotFoundPage from "./pages/404"
import NovelHome from "./pages/novel/NovelHome"
function App() {
  const { user, isCheckingAuth, authCheck } = useAuthStore()
  console.log("Auth user is here: ", user) 
  useEffect(() => {
    authCheck()
  }, [authCheck])
  if(isCheckingAuth) {
    return(
      <div className="h-screen">
        <div className="flex justify-center items-center bg-black h-full">
          <Loader className="animate-spin text-red-600 size-10" />
        </div>
      </div>
    )
  }
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/login" element={!user ? <LogInPage/> : <Navigate to={"/"} />} />
        <Route path="/signup" element={!user ? <SignUpPage/> : <Navigate to={"/"} />} />
        <Route path="/watch/:id" element={user ? <WatchPage/> : <Navigate to={"/login"} />} />
        
        <Route path="/search" element={user ? <SearchPage/> : <Navigate to={"/login"} />} />
        <Route path="/history" element={user ? <SearchHistoryPage/> : <Navigate to={"/login"} />} />
       
        <Route path="/novel" element={user ?<NovelHome/> : <Navigate to={"/login"} />} />

        <Route path="/*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
      <Footer />
    </>
  )
}

export default App
