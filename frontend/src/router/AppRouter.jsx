import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "../pages/Home"
import Profile from "../pages/Profile"
import CreateMatch from "../pages/CreateMatch"
import MyMatches from "../pages/MyMatches"

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create" element={<CreateMatch />} />
        <Route path="/matches" element={<MyMatches />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter