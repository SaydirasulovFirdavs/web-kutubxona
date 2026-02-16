import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './MainLayout.css';
import Footer from './Footer';

function MainLayout() {
    return (
        <div className="main-layout">

            <Navbar />
            <main className="main-content">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
}

export default MainLayout;
