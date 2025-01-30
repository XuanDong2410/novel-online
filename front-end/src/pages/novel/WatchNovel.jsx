import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import Navbar from "../../components/Navbar";
import { ORIGINAL_IMG_BASE_URL} from "../../utils/constants"
import { formatReleaseDate } from "../../utils/dateFunction"
 import WatchPageSkeleton from "../../components/skeletons/WatchPageSkeleton"

const WatchNovel = () => {
    const { id } = useParams()
    const [novel, setNovel] = useState([])
    const [currentNovelIdx, setCurrentNovelIdx] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const getNovels = async () => {
            try {
                const res = await axios.get(`/api/v1/novel/${id}`)
                setNovel(res.data.data)
            } catch (error) {
                if(error.message.includes('404')){
                    setNovel([])
                }
            }finally {
                setLoading(false);
            }
        }
        getNovels()
    }, [id])  
    
    const handlePrev = () => {
        if(currentNovelIdx > 0) setCurrentNovelIdx(currentNovelIdx - 1)
    }
    const handleNext = () => {
        if(currentNovelIdx < novel.length - 1) setCurrentNovelIdx(currentNovelIdx + 1)
    }
    if(loading) return (
        <div className="min-h-scree bg-black p-10">
            <WatchPageSkeleton />
        </div>
    )
    if (!novel) {
		return (
			<div className='bg-black text-white h-screen'>
				<div className='max-w-6xl mx-auto'>
					<Navbar />
					<div className='text-center mx-auto px-4 py-8 h-full mt-40'>
						<h2 className='text-2xl sm:text-5xl font-bold text-balance'>novel not found 😥</h2>
					</div>
				</div>
			</div>
		);
	}
    console.log("Novel: ", novel)
    return <div className="bg-black min-h-screen text-white">
        <div className="mx-auto container px-4 py-8 h-full">
            <Navbar />

            {novel.length > 0 && (
                <div className="flex justify-between items-center mb-4">
                    <button 
                        className={`
                            bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded
                            ${currentNovelIdx === 0 ? 'opacity-50 cursor-not-allowed ' : ""}
                            `}
                        disabled={currentNovelIdx === 0}
                        onClick={handlePrev}
                    >
                        <ChevronLeft 
                            size={24}
                        />
                    </button>

                    <button 
                        className={`
                            bg-gray-500/70 hover:bg-gray-500 text-white py-2 px-4 rounded
                            ${currentNovelIdx === novel.length - 1 ? 'opacity-50 cursor-not-allowed ' : ""}
                            `}
                        disabled={currentNovelIdx === novel.length - 1}
                        onClick={handleNext}
                    >
                        <ChevronRight 
                            size={24} 
                        />
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center justify-between gap-20 max-w-6xl mx-auto">
                <div className="mb-4 md:mb-0" key={novel?._id}>
                    <h2 className="text-5xl font-bold text-balance">
                        {novel?.title }
                    </h2>

                    <p className="mt-2 text-lg">
                        {formatReleaseDate(novel?.release_date || novel?.first_air_date)} |{" "}
                        {novel?.adult ? (
                            <span className="text-red-600">18+</span>
                        ): (
                            <span className="text-green-600">PG-13</span>
                        )}{" "}
                    </p>
                    <p className="mt-4 text-lg">{novel?.description}</p>
                </div>
                <img 
                    src={ORIGINAL_IMG_BASE_URL + novel?.poster_path} 
                    alt="Poster image" 
                    className="max-h-[600px] rounded-md"
                />
            </div>
                <div className="flex mt-8">
                    <Link 
                        to={`/chapter/${novel._id}`}
                        className="bg-white hover:bg-white/80 text-black font-bold py-2 px-4 rounded mr-4 flex items-center"
                    >
                        <Play className='size-6 mr-2 fill-black'/>
                        Read
                    </Link>
                </div>
        </div>
    </div>
}

export default WatchNovel