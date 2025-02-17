import { useEffect, useState } from "react";
import axios from "axios";

const useGetAllNovel = () => {
    const [allNovel, setAllNovel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNovels = async () => {
            try {
                const res = await axios.get(`api/v1/novel/`);
                setAllNovel(res.data.data);
            } catch (error) {
                console.error("Lỗi API:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNovels();
    }, []);
    console.log("novel:",allNovel);
    return { allNovel, loading };
};

export default useGetAllNovel;
