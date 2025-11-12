import { CalendarDays, Music, Apple, CornerUpLeftIcon } from "lucide-react";
import moment from "moment";
import { useMemo } from "react";

export default function EventsSection({ events }: { events: any[] }) {
  const mockEvents = useMemo(() => {
    return [
      // {
      //   id: 1,
      //   title: "Fall Harvest Festival (Sept 20 - Oct 31)",
      //   description:
      //     "Celebrate the beauty of autumn with a full farm activities and experience!",
      //   dateRange: "Sep 20 – 31, 2024",
      //   icon: <CalendarDays className="w-5 h-5 text-orange-500" />,
      //   image:
      //     "https://images.pexels.com/photos/585759/pexels-photo-585759.jpeg?auto=compress",
      // },
      ...(events?.map((v: any) => ({
        id: v?.id,
        title: v?.title,
        image: v?.image,
        description: v?.description,
        icon: v?.icon,
        dateRange: moment(v?.created_on).format("MMMM DD, YYYY"),
      })) ?? []),
    ];
  }, [events]);
  // const mockEvents = [
  //   {
  //     id: 1,
  //     title: "Fall Harvest Festival (Sept 20 - Oct 31)",
  //     description:
  //       "Celebrate the beauty of autumn with a full farm activities and experience!",
  //     dateRange: "Sep 20 – 31, 2024",
  //     icon: <CalendarDays className="w-5 h-5 text-orange-500" />,
  //     image:
  //       "https://images.pexels.com/photos/585759/pexels-photo-585759.jpeg?auto=compress",
  //   },
  //   {
  //     id: 2,
  //     title: "Live Music Weekend at the Barn",
  //     description:
  //       "This Saturday, enjoy live country & folk music while savoring farm-fresh BBQ at Barnyard Grill!",
  //     dateRange: "Jun 20, 2024",
  //     icon: <Music className="w-5 h-5 text-blue-600" />,
  //     image:
  //       "https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg?auto=compress",
  //   },
  //   {
  //     id: 3,
  //     title: "Apple Picking Season is Here",
  //     description:
  //       "Come handpick your own apples and taste our freshly made apple cider. Book now!",
  //     dateRange: "Jun 18, 2024",
  //     icon: <Apple className="w-5 h-5 text-green-600" />,
  //     image:
  //       "https://images.pexels.com/photos/1278653/pexels-photo-1278653.jpeg?auto=compress",
  //   },
  //   {
  //     id: 4,
  //     title: "Corn Maze Challenge: Are You Up for It?",
  //     description:
  //       "Our famous 5-acre corn maze is now open! Tag a friend and take the challenge!",
  //     dateRange: "Aug 5, 2024",
  //     icon: <CornerUpLeftIcon className="w-5 h-5 text-yellow-500" />,
  //     image:
  //       "https://images.pexels.com/photos/2893247/pexels-photo-2893247.jpeg?auto=compress",
  //   },
  // ];

  return (
    <section className="max-w-7xl mx-auto text-gray-800 px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Berita & Acara</h2>
        <p className="text-gray-600">
          Dapatkan informasi terkini seputar kegiatan, acara, dan pembaruan
          terbaru dari kami.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 mb-8">
        <button className="px-4 py-2 rounded-full bg-black text-white text-sm">
          Semua
        </button>
        <button className="px-4 py-2 rounded-full border text-sm">
          Akan Datang
        </button>
        <button className="px-4 py-2 rounded-full border text-sm">
          Telah Berlangsung
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function EventCard({ event }: any) {
  return (
    <div className="rounded-2xl shadow-sm bg-white overflow-hidden hover:shadow-md transition">
      {/* Image */}
      <div className="h-40 w-full bg-gray-200 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">{event.icon}</div>

        <h3 className="font-semibold text-lg leading-tight mb-2">
          {event.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4">{event.description}</p>

        <span className="text-xs text-gray-500">{event.dateRange}</span>
      </div>
    </div>
  );
}
