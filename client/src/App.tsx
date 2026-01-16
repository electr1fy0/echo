import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Home } from "@/pages/home";
import { Profile } from "@/pages/profile";
import { Search } from "@/pages/search";

function Layout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 flex flex-col items-center">
        <div className="absolute top-4 right-4 z-10">
          <ModeToggle />
        </div>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
