import "./App.css";
import { NavBar } from './components/NavBar';
import { MainCanvas } from './components/MainCanvas';
import { SidebarRight } from './components/SidebarRight';

function App() {
  return (
    <>
      <NavBar />
      <div className="app-body">
        <MainCanvas />
        <SidebarRight />
      </div>
    </>
  );
}

export default App;
