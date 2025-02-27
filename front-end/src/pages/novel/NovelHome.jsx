
import { useEffect } from "react";
import useGetAllNovel from "../../hooks/novel/useGetAllNovel";
import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom";
import { Info, Play } from "lucide-react";
const NovelHome = () => {
    const { allNovel, loading } = useGetAllNovel();

    useEffect(() => {
        console.log("Cập nhật dữ liệu:", allNovel);
    }, [allNovel]); // Chạy khi `allNovel` thay đổi

    if (loading) return <p>Loading...</p>;
    if (!allNovel) return <p>Không có dữ liệu.</p>;

    return (
        <div className="relative h-screen text-white">
            <Navbar />
            
            <div 
            className="absolute top-0 left-0 w-full h-full bg-black/50 -z-50" 
            aria-hidden='true'
            />
            <div className="bg-gradient-to-b from-black via-transparent to-transparent absolute w-full h-full top-0 left-0 -z-10" />
            <div className="w-full flex flex-col justify-center px-8 md:px-16 lg:px-32 overflow-auto">
                {allNovel.map((novel) => (
                    <>
                        <div key={novel._id}>
                            <p key={novel._id}>{novel.title}</p>
                            <p><b>Tác giả:</b> {novel.author}</p>
                            <p><b>Mô tả:</b> {novel.description}</p>
                            <p><b>Thể loại:</b> {novel.genre.join(", ")}</p>
                            <div className="flex mt-8">
                                <Link 
                                    to={`/novel/${novel._id}`}
                                    className="bg-white hover:bg-white/80 text-black font-bold py-2 px-4 rounded mr-4 flex items-center"
                                >
                                    <Play className='size-6 mr-2 fill-black'/>
                                    Read
                                </Link>
                                <Link 
                                    to={`/novel/${novel._id}`}
                                    className="bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded flex items-center"
                                >
                                    <Info className='size-6 mr-2'/>
                                    More Info
                                </Link>
                            </div>
                        </div>
                    </>
                ))}
            </div>
        </div>
    );
};

export default NovelHome;
