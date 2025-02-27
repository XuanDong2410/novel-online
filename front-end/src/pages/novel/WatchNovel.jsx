import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import axios from "axios"
 import { Play } from "lucide-react"
import Navbar from "../../components/Navbar";
import { ORIGINAL_IMG_BASE_URL} from "../../utils/constants"
import { formatReleaseDate } from "../../utils/dateFunction"
 import WatchPageSkeleton from "../../components/skeletons/WatchPageSkeleton"
import ChapterList from "../../components/novels/ChapterList";

 
const people = [
    {
      name: 'Leslie Alexander',
      email: 'leslie.alexander@example.com',
      role: 'Co-Founder / CEO',
      imageUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      lastSeen: '3h ago',
      lastSeenDateTime: '2023-01-23T13:23Z',
    },
    {
      name: 'Michael Foster',
      email: 'michael.foster@example.com',
      role: 'Co-Founder / CTO',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      lastSeen: '3h ago',
      lastSeenDateTime: '2023-01-23T13:23Z',
    },
    {
      name: 'Dries Vincent',
      email: 'dries.vincent@example.com',
      role: 'Business Relations',
      imageUrl:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      lastSeen: '3h ago',
    },
    {
      name: 'Lindsay Walton',
      email: 'lindsay.walton@example.com',
      role: 'Front-end Developer',
      imageUrl:
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      lastSeen: '3h ago',
      lastSeenDateTime: '2023-01-23T13:23Z',
    },
    {
      name: 'Courtney Henry',
      email: 'courtney.henry@example.com',
      role: 'Designer',
      imageUrl:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      lastSeen: '3h ago',
      lastSeenDateTime: '2023-01-23T13:23Z',
    },
    {
      name: 'Tom Cook',
      email: 'tom.cook@example.com',
      role: 'Director of Product',
      imageUrl:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      lastSeen: '3h ago',
    },
  ]
const WatchNovel = () => {
    const { id } = useParams()
    const [novel, setNovel] = useState([])
    // const [currentNovelIdx, setCurrentNovelIdx] = useState(0)
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
    
    // const handlePrev = () => {
    //     if(currentNovelIdx > 0) setCurrentNovelIdx(currentNovelIdx - 1)
    // }
    // const handleNext = () => {
    //     if(currentNovelIdx < novel.length - 1) setCurrentNovelIdx(currentNovelIdx + 1)
    // }
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
    //console.log("Novel: ", novel)
    return <div className="bg-black min-h-screen text-white">
        <div className="mx-auto container px-4 py-8 h-full">
            <Navbar />          

            <div className="flex flex-col md:flex-row items-center justify-between gap-20 max-w-6xl mx-auto">
                <div className="mb-4 md:mb-0" key={novel?._id}>
                    <h2 className="text-4xl font-bold text-balance">
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
                    <img 
                        src={ORIGINAL_IMG_BASE_URL + novel?.poster_path} 
                        alt="Poster image" 
                        className="max-h-[600px] rounded-md"
                    />
                    
                    <p className="mt-4 text-lg">{novel?.description}</p>
                </div>
                
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
        <ChapterList />
    </div>
}

export default WatchNovel

  
  export function Example() {
    return (
      <ul role="list" className="divide-y divide-gray-100">
        {people.map((person) => (
          <li key={person.email} className="flex justify-between gap-x-6 py-5">
            <div className="flex min-w-0 gap-x-4">
              <img alt="" src={person.imageUrl} className="size-12 flex-none rounded-full bg-gray-50" />
              <div className="min-w-0 flex-auto">
                <p className="text-sm/6 font-semibold text-gray-900">{person.name}</p>
                <p className="mt-1 truncate text-xs/5 text-gray-500">{person.email}</p>
              </div>
            </div>
            <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
              <p className="text-sm/6 text-gray-900">{person.role}</p>
              {person.lastSeen ? (
                <p className="mt-1 text-xs/5 text-gray-500">
                  Last seen <time dateTime={person.lastSeenDateTime}>{person.lastSeen}</time>
                </p>
              ) : (
                <div className="mt-1 flex items-center gap-x-1.5">
                  <div className="flex-none rounded-full bg-emerald-500/20 p-1">
                    <div className="size-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <p className="text-xs/5 text-gray-500">Online</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    )
  }
  