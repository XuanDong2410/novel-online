import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/home/HomePage"
import SignUpPage from "./pages/SignUpPage"
import LogInPage from "./pages/LogInPage"
import Footer from "./components/Footer"

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage/>} />
        <Route path="/login" element={<LogInPage/>} />
        <Route path="/signup" element={<SignUpPage/>} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
