import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, LogOut, Plus, RefreshCcw, MessageCircle } from "lucide-react";
import { supabase } from "./lib/supabase";

function Admin() {
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem("weddingAdminAuth") === "true"
    );

    const [responses, setResponses] = useState([]);
    const [guests, setGuests] = useState([]);

    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");

    const ADMIN_PASSWORD = "MoamenMarwa2026";

    useEffect(() => {
        if (isAuthenticated) {
            fetchResponses();
            fetchGuests();
        }
    }, [isAuthenticated]);

    const shareOnWhatsApp = (guest) => {
        const link = `https://wedding-dun-two.vercel.app/?id=${guest.id}`;

        const message = `Hello ${guest.name} 

Moamen & Marwa would be honored by your presence at their wedding.

Date: 16/10/2026
Location: Al Mina, Moon Side

Your invitation link:
${link}`;

        const phone = guest.phone?.replace(/\D/g, "");

        const whatsappUrl = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");
    };

    const fetchResponses = async () => {
        const { data, error } = await supabase
            .from("rsvp")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            toast.error(error.message);
            return;
        }

        setResponses(data || []);
    };

    const fetchGuests = async () => {
        const { data, error } = await supabase
            .from("guests")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            toast.error(error.message);
            return;
        }

        setGuests(data || []);
    };

    const refreshData = () => {
        fetchResponses();
        fetchGuests();
        toast.success("Dashboard refreshed ❤️");
    };

    const addGuest = async (e) => {
        e.preventDefault();

        const cleanName = guestName.trim();
        const cleanPhone = guestPhone.trim();

        if (!cleanName) {
            toast.error("Guest name is required");
            return;
        }

        const { error } = await supabase.from("guests").insert({
            name: cleanName,
            phone: cleanPhone || null,
        });

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Guest added ❤️");
        setGuestName("");
        setGuestPhone("");
        fetchGuests();
    };

    const copyGuestLink = async (guest) => {
        const link = `${window.location.origin}/?id=${guest.id}`;

        await navigator.clipboard.writeText(link);

        toast.success("Invitation link copied ❤️");
    };

    const logout = () => {
        localStorage.removeItem("weddingAdminAuth");
        setIsAuthenticated(false);
        toast.success("Logged out");
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-orange-50 flex items-center justify-center p-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();

                        if (password === ADMIN_PASSWORD) {
                            localStorage.setItem("weddingAdminAuth", "true");
                            setIsAuthenticated(true);
                            toast.success("Welcome back ❤️");
                        } else {
                            toast.error("Wrong password");
                        }
                    }}
                    className="bg-white/90 backdrop-blur p-10 rounded-3xl shadow-xl max-w-md w-full border border-rose-100"
                >
                    <h1 className="font-serif text-5xl text-rose-900 text-center mb-4">
                        Admin Login
                    </h1>

                    <p className="text-center text-stone-500 mb-8">
                        Moamen & Marwa wedding dashboard
                    </p>

                    <input
                        type="password"
                        placeholder="Admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-full px-5 py-4 border border-rose-200 outline-none mb-5 focus:ring-2 focus:ring-rose-300"
                    />

                    <button
                        type="submit"
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-full transition shadow"
                    >
                        Login
                    </button>
                </form>
            </main>
        );
    }

    const accepted = responses.filter((r) => r.attending).length;
    const declined = responses.filter((r) => !r.attending).length;

    const totalSeats = responses.reduce(
        (sum, r) => sum + Number(r.seats || 0),
        0
    );

    return (
        <main className="min-h-screen bg-rose-50 p-6 text-stone-800">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-serif text-5xl text-rose-900">
                            Wedding Dashboard
                        </h1>
                        <p className="text-stone-500 mt-2">
                            Manage guests, links, RSVP responses, and wishes.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={refreshData}
                            className="inline-flex items-center gap-2 bg-white text-rose-700 border border-rose-200 px-5 py-3 rounded-full shadow hover:bg-rose-50 transition"
                        >
                            <RefreshCcw size={18} />
                            Refresh
                        </button>

                        <button
                            onClick={logout}
                            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-full shadow transition"
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white rounded-3xl p-6 shadow border border-rose-100">
                        <p className="text-gray-500 mb-2">Total Responses</p>
                        <p className="text-5xl font-bold text-rose-700">
                            {responses.length}
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow border border-rose-100">
                        <p className="text-gray-500 mb-2">Accepted</p>
                        <p className="text-5xl font-bold text-green-600">{accepted}</p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow border border-rose-100">
                        <p className="text-gray-500 mb-2">Declined</p>
                        <p className="text-5xl font-bold text-red-500">{declined}</p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow border border-rose-100">
                        <p className="text-gray-500 mb-2">Reserved Seats</p>
                        <p className="text-5xl font-bold text-blue-600">{totalSeats}</p>
                    </div>
                </div>

                <section className="bg-white rounded-3xl shadow border border-rose-100 p-6 mb-10">
                    <h2 className="font-serif text-3xl text-rose-900 mb-6">
                        Add Guest
                    </h2>

                    <form onSubmit={addGuest} className="grid md:grid-cols-3 gap-4">
                        <input
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Guest name"
                            required
                            className="rounded-full px-5 py-4 border border-rose-200 outline-none focus:ring-2 focus:ring-rose-300"
                        />

                        <input
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            placeholder="Phone optional"
                            className="rounded-full px-5 py-4 border border-rose-200 outline-none focus:ring-2 focus:ring-rose-300"
                        />

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full px-6 py-4 transition shadow"
                        >
                            <Plus size={18} />
                            Add Guest
                        </button>
                    </form>
                </section>

                <section className="bg-white rounded-3xl shadow border border-rose-100 p-6 mb-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                        <h2 className="font-serif text-3xl text-rose-900">
                            Guest Invitation Links
                        </h2>

                        <p className="text-stone-500">{guests.length} guests</p>
                    </div>

                    <div className="space-y-3">
                        {guests.map((guest) => {
                            const link = `${window.location.origin}/?id=${guest.id}`;

                            return (
                                <div
                                    key={guest.id}
                                    className="flex flex-col md:flex-row md:items-center justify-between gap-3 border border-rose-100 rounded-2xl p-4 hover:bg-rose-50 transition"
                                >
                                    <div>
                                        <p className="font-semibold text-lg">{guest.name}</p>

                                        {guest.phone && (
                                            <p className="text-sm text-stone-500">
                                                Phone: {guest.phone}
                                            </p>
                                        )}

                                        <p className="text-sm text-stone-500 break-all">{link}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => copyGuestLink(guest)}
                                            className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-full transition shrink-0"
                                        >
                                            <Copy size={18} />
                                            Copy Link
                                        </button>

                                        <button
                                            onClick={() => shareOnWhatsApp(guest)}
                                            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-full transition shrink-0"
                                        >
                                            <MessageCircle size={18} />
                                            WhatsApp
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {guests.length === 0 && (
                            <div className="text-center py-12 text-stone-500">
                                No guests added yet.
                            </div>
                        )}
                    </div>
                </section>

                <section className="bg-white rounded-3xl shadow border border-rose-100 overflow-hidden">
                    <div className="p-6 border-b border-rose-100">
                        <h2 className="font-serif text-3xl text-rose-900">
                            RSVP Responses
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-rose-100">
                                <tr>
                                    <th className="p-4 text-left">Guest</th>
                                    <th className="p-4 text-left">Coming</th>
                                    <th className="p-4 text-left">Seats</th>
                                    <th className="p-4 text-left">Message</th>
                                    <th className="p-4 text-left">Date</th>
                                </tr>
                            </thead>

                            <tbody>
                                {responses.map((response) => (
                                    <tr key={response.id} className="border-t hover:bg-rose-50">
                                        <td className="p-4 font-medium">
                                            {response.guest_name || "-"}
                                        </td>

                                        <td className="p-4">
                                            {response.attending ? (
                                                <span className="text-green-600 font-semibold">
                                                    Yes
                                                </span>
                                            ) : (
                                                <span className="text-red-500 font-semibold">No</span>
                                            )}
                                        </td>

                                        <td className="p-4">{response.seats}</td>

                                        <td className="p-4 max-w-md">
                                            {response.message || "-"}
                                        </td>

                                        <td className="p-4 text-sm text-stone-500">
                                            {response.created_at
                                                ? new Date(response.created_at).toLocaleString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {responses.length === 0 && (
                            <div className="text-center py-16 text-gray-500">
                                No RSVP responses yet.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Admin;