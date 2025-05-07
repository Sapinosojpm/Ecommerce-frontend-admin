import { useEffect, useState } from "react";
import axios from "axios";

const LatestProductEditor = () => {
    const [maxDisplay, setMaxDisplay] = useState(10);

    useEffect(() => {
        const fetchSetting = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/latest-products`);
                setMaxDisplay(response.data.maxDisplay);
            } catch (error) {
                console.error("Error fetching latest product setting:", error);
            }
        };
        fetchSetting();
    }, []);

    const handleSave = async () => {
        try {
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/latest-products`, { maxDisplay });
            alert("Latest product display limit updated!");
        } catch (error) {
            console.error("Error updating setting:", error);
        }
    };

    return (
        <div className="p-4 bg-white rounded shadow">
            <h2 className="mb-2 text-xl font-bold">Latest Products Display Limit</h2>
            <input
                type="number"
                min="1"
                value={maxDisplay}
                onChange={(e) => setMaxDisplay(e.target.value)}
                className="w-full p-2 border"
            />
            <button onClick={handleSave} className="px-4 py-2 mt-2 text-white bg-blue-500 rounded">
                Save
            </button>
        </div>
    );
};

export default LatestProductEditor;
