import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Copy,
  Flower2,
  Gift,
  Heart,
  MapPin,
  MessageCircle,
  Music,
  Send,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "./lib/supabase";

import wedding1 from "./assets/1.jpeg";
import wedding2 from "./assets/2.jpeg";
import wedding3 from "./assets/3.jpeg";
import wedding4 from "./assets/4.jpeg";
import wedding5 from "./assets/cover.jpeg"

/* =========================================================
   FLOATING FLOWERS
========================================================= */

function FloatingPetals() {
  const petals = useMemo(
    () =>
      [...Array(20)].map(() => ({
        left: `${Math.random() * 100}%`,
        duration: `${15 + Math.random() * 10}s`,
        delay: `${Math.random() * 5}s`,
        size: `${18 + Math.random() * 12}px`,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {petals.map((petal, index) => (
        <span
          key={index}
          className="petal"
          style={{
            left: petal.left,
            animationDuration: petal.duration,
            animationDelay: petal.delay,
            fontSize: petal.size,
          }}
        >
          🌸
        </span>
      ))}
    </div>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const audioRef = useRef(null);

  /* -------------------------------------------------------
     URL / GUEST
  ------------------------------------------------------- */

  const params = new URLSearchParams(window.location.search);
  const guestId = params.get("id");

  /* -------------------------------------------------------
     STATE
  ------------------------------------------------------- */

  const [guestName, setGuestName] = useState("");
  const [guestLoading, setGuestLoading] = useState(true);
  const [guestError, setGuestError] = useState("");

  const [invitationOpened, setInvitationOpened] = useState(false);
  const [coverVisible, setCoverVisible] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [attending, setAttending] = useState("");
  const [seats, setSeats] = useState("1");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  /* -------------------------------------------------------
     LOAD GUEST
  ------------------------------------------------------- */

  useEffect(() => {
    const loadGuest = async () => {
      if (!guestId) {
        setGuestError("Invalid invitation link");
        setGuestLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("guests")
        .select("name")
        .eq("id", guestId)
        .maybeSingle();

      if (error || !data) {
        setGuestError("Guest not found");
        setGuestLoading(false);
        return;
      }

      setGuestName(data.name);
      setGuestLoading(false);
    };

    loadGuest();
  }, [guestId]);

  /* -------------------------------------------------------
     CHECK EXISTING RSVP
  ------------------------------------------------------- */

  useEffect(() => {
    const checkExistingResponse = async () => {
      if (!guestId) return;

      const { data, error } = await supabase
        .from("rsvp")
        .select("id, attending, seats, message")
        .eq("guest_id", guestId)
        .maybeSingle();

      if (error) {
        console.error("RSVP check error:", error);
        return;
      }

      if (data) {
        setAlreadyResponded(true);
        setSubmittedAnswer(data.attending ? "yes" : "no");
      }
    };

    checkExistingResponse();
  }, [guestId]);

  /* -------------------------------------------------------
     COUNTDOWN
  ------------------------------------------------------- */

  useEffect(() => {
    const weddingDate = new Date("2026-10-16T20:00:00");

    const updateCountdown = () => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference / (1000 * 60 * 60)) % 24
      );
      const minutes = Math.floor(
        (difference / (1000 * 60)) % 60
      );
      const seconds = Math.floor(
        (difference / 1000) % 60
      );

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
      });
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  /* -------------------------------------------------------
     AUDIO
  ------------------------------------------------------- */

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
    }
  }, []);

  const openInvitation = async () => {
    const audio = audioRef.current;

    if (audio) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.log("Could not start music:", error);
      }
    }

    setInvitationOpened(true);

    setTimeout(() => {
      setCoverVisible(false);
    }, 800);
  };

  const toggleMusic = async () => {
    const audio = audioRef.current;

    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.log("Could not play music:", error);
      }
    }
  };

  /* -------------------------------------------------------
     RSVP
  ------------------------------------------------------- */

  const submitRSVP = async (e) => {
    e.preventDefault();

    if (!attending) {
      toast.error("Please choose whether you will attend ❤️");
      return;
    }

    if (alreadyResponded) {
      toast.info("You have already responded to this invitation ❤️");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: existingResponse, error: checkError } =
        await supabase
          .from("rsvp")
          .select("id")
          .eq("guest_id", guestId)
          .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (existingResponse) {
        setAlreadyResponded(true);
        toast.info("You have already responded to this invitation ❤️");
        return;
      }

      const attendingValue = attending === "yes";

      const { error } = await supabase.from("rsvp").insert({
        guest_id: guestId,
        guest_name: guestName,
        attending: attendingValue,
        seats: attendingValue ? Number(seats || 1) : 0,
        message: message.trim() || null,
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      setSubmittedAnswer(attending);

      toast.success("Your RSVP has been received ❤️");
    } catch (error) {
      console.error("RSVP error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------------------------------------------------
     COPY
  ------------------------------------------------------- */

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Number copied ❤️");
    } catch {
      toast.error("Could not copy the number");
    }
  };

  /* -------------------------------------------------------
     LOADING
  ------------------------------------------------------- */

  if (guestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50">
        <div className="text-center">
          <Flower2 className="mx-auto mb-4 text-rose-500" size={40} />

          <p className="text-rose-700 text-xl font-serif">
            Loading invitation...
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------
     ERROR
  ------------------------------------------------------- */

  if (guestError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-rose-50 px-6 text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md">
          <Flower2
            className="mx-auto mb-5 text-rose-500"
            size={48}
          />

          <h1 className="font-serif text-4xl text-rose-900 mb-4">
            Invalid Invitation
          </h1>

          <p className="text-stone-600">
            {guestError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rose-50 text-stone-800 overflow-x-hidden">
      <FloatingPetals />

      {/* =====================================================
          AUDIO
      ===================================================== */}

      <audio ref={audioRef} loop preload="auto">
        <source src="/music.mp3" type="audio/mpeg" />
      </audio>

      {/* =====================================================
          ANIMATED COVER
      ===================================================== */}

      {coverVisible && (
        <div
          className={`fixed inset-0 z-[100] bg-rose-50 overflow-hidden
            transition-all duration-800 ease-in-out
            ${invitationOpened
              ? "opacity-0 scale-110 pointer-events-none"
              : "opacity-100 scale-100"
            }`}
        >
          <div className="relative h-screen w-full flex items-center justify-center overflow-hidden">

            {/* Background image */}
            <img
              src={wedding5}
              alt="Wedding5"
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Decorative flowers */}
            <div className="absolute top-8 left-8 text-6xl opacity-80 animate-pulse">
              🌸
            </div>

            <div className="absolute bottom-8 right-8 text-6xl opacity-80 animate-pulse">
              🌸
            </div>

            <div className="absolute top-1/4 right-10 text-4xl opacity-60">
              🌷
            </div>

            <div className="absolute bottom-1/4 left-10 text-4xl opacity-60">
              🌷
            </div>

            {/* Content */}
            <div
              className={`relative z-10 text-center text-white px-6
                transition-all duration-700 ease-out
                ${invitationOpened
                  ? "opacity-0 -translate-y-8 scale-95"
                  : "opacity-100 translate-y-0 scale-100"
                }`}
            >
              <p className="uppercase tracking-[0.4em] text-sm md:text-base mb-6">
                You are invited to
              </p>

              <h1 className="font-serif text-6xl md:text-8xl mb-5">
                Eng.Moamen & Marwa
              </h1>

              <div className="w-24 h-px bg-white/80 mx-auto mb-6" />

              <p className="font-serif text-2xl md:text-3xl mb-10">
                16 • 10 • 2026
              </p>

              <button
                onClick={openInvitation}
                className="
                  bg-white
                  text-rose-800
                  px-10
                  py-4
                  rounded-full
                  shadow-2xl
                  hover:bg-rose-50
                  hover:scale-105
                  active:scale-95
                  transition-all
                  duration-300
                  font-medium
                "
              >
                <span className="flex items-center gap-3">
                  🌸
                  Open Invitation
                  🌸
                </span>
              </button>

              <p className="mt-6 text-sm text-white/80">
                Tap to enter & hear our song
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MUSIC BUTTON
      ===================================================== */}

      <button
        onClick={toggleMusic}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        className="
          fixed
          bottom-6
          right-6
          z-50
          w-16
          h-16
          rounded-full
          bg-rose-600
          hover:bg-rose-700
          hover:scale-110
          transition-all
          duration-300
          text-white
          shadow-xl
          flex
          items-center
          justify-center
        "
      >
        {isPlaying ? (
          <Volume2 size={28} />
        ) : (
          <VolumeX size={28} />
        )}
      </button>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=2000&q=90"
          alt="Wedding flowers"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/35" />

        <div className="relative z-20 text-center text-white px-6">
          <p className="uppercase tracking-[0.35em] text-sm mb-6">
            Together with their families
          </p>

          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl">
            Eng.Moamen
          </h1>

          <div className="flex items-center justify-center gap-5 my-5">
            <div className="w-16 md:w-24 h-px bg-white/70" />

            <Heart
              fill="currentColor"
              size={30}
              className="text-rose-200"
            />

            <div className="w-16 md:w-24 h-px bg-white/70" />
          </div>

          <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl">
            Marwa
          </h1>

          <p className="font-serif text-2xl md:text-3xl mt-8">
            Are getting married
          </p>

          <p className="mt-4 text-lg tracking-wide">
            16 October 2026
          </p>
        </div>
      </section>

      {/* =====================================================
          PERSONAL INVITATION
      ===================================================== */}

      <section className="py-24 px-6 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <Flower2
            className="mx-auto text-rose-400 mb-6"
            size={42}
          />

          <p className="uppercase tracking-[0.3em] text-sm text-rose-500 mb-5">
            Dear
          </p>

          <h2 className="font-serif text-5xl md:text-6xl text-rose-900 mb-8">
            {guestName}
          </h2>

          <p className="text-lg md:text-xl leading-relaxed text-stone-600">
            We would be truly honored to have you with us as we
            celebrate the beginning of our new journey together.
          </p>

          <div className="mt-10 flex justify-center">
            <Heart
              className="text-rose-400"
              size={30}
              fill="currentColor"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          LOVE MESSAGE
      ===================================================== */}

      <section className="py-24 px-6 bg-rose-50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="uppercase tracking-[0.3em] text-sm text-rose-500 mb-5">
            Our story
          </p>

          <h2 className="font-serif text-5xl md:text-6xl text-rose-900 mb-8">
            Two hearts, one beautiful journey
          </h2>

          <p className="text-lg leading-relaxed text-stone-600 max-w-2xl mx-auto">
            Some moments become memories. Some memories become
            stories. And some stories become forever.
          </p>

          <div className="mt-10">
            <span className="text-5xl">🌹</span>
          </div>
        </div>
      </section>

      {/* =====================================================
          WEDDING DETAILS
      ===================================================== */}

      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-sm text-rose-500 mb-4">
              Save the date
            </p>

            <h2 className="font-serif text-5xl md:text-6xl text-rose-900">
              Wedding Details
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Date */}
            <div className="text-center p-8 rounded-3xl bg-rose-50">
              <Calendar
                className="mx-auto text-rose-500 mb-5"
                size={42}
              />

              <h3 className="font-serif text-2xl text-rose-900 mb-3">
                Date
              </h3>

              <p className="text-stone-600">
                Friday
              </p>

              <p className="text-lg font-medium text-stone-800 mt-1">
                16 October 2026
              </p>
            </div>

            {/* Time */}
            <div className="text-center p-8 rounded-3xl bg-rose-50">
              <Clock
                className="mx-auto text-rose-500 mb-5"
                size={42}
              />

              <h3 className="font-serif text-2xl text-rose-900 mb-3">
                Time
              </h3>

              <p className="text-stone-600">
                Ceremony begins at
              </p>

              <p className="text-lg font-medium text-stone-800 mt-1">
                8:00 PM
              </p>
            </div>

            {/* Location */}
            <div className="text-center p-8 rounded-3xl bg-rose-50">
              <MapPin
                className="mx-auto text-rose-500 mb-5"
                size={42}
              />

              <h3 className="font-serif text-2xl text-rose-900 mb-3">
                Location
              </h3>

              <p className="text-stone-600">
                Al Mina
              </p>

              <p className="text-lg font-medium text-stone-800 mt-1">
                Moon Side
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          COUNTDOWN
      ===================================================== */}

      <section className="py-24 px-6 bg-rose-900 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <p className="uppercase tracking-[0.3em] text-sm text-rose-200 mb-5">
            Counting the moments
          </p>

          <h2 className="font-serif text-5xl md:text-6xl mb-14">
            Until we say "I do"
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              ["Days", timeLeft.days],
              ["Hours", timeLeft.hours],
              ["Minutes", timeLeft.minutes],
              ["Seconds", timeLeft.seconds],
            ].map(([label, value]) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur rounded-3xl p-6 md:p-8"
              >
                <div className="font-serif text-4xl md:text-6xl">
                  {String(value).padStart(2, "0")}
                </div>

                <div className="uppercase tracking-widest text-xs md:text-sm text-rose-200 mt-3">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          GALLERY
      ===================================================== */}

      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-sm text-rose-500 mb-4">
              A little romance
            </p>

            <h2 className="font-serif text-5xl md:text-6xl text-rose-900">
              Love in pictures
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            <img
              src={wedding1}
              alt="Wedding"
              className="w-full h-full object-cover"
            />

            <img
              src={wedding2}
              alt="Wedding"
              className="w-full h-full object-cover"
            />

            <img
              src={wedding3}
              alt="Wedding"
              className="w-full h-full object-cover"
            />

            <img
              src={wedding4}
              alt="Wedding"
              className="w-full h-full object-cover"
            />

          </div>
        </div>
      </section>

      {/* =====================================================
          TIMELINE
      ===================================================== */}

      <section className="py-24 px-6 bg-rose-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-sm text-rose-500 mb-4">
              The celebration
            </p>

            <h2 className="font-serif text-5xl md:text-6xl text-rose-900">
              Evening Timeline
            </h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-6 items-center bg-white rounded-3xl p-6 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Clock className="text-rose-600" />
              </div>

              <div>
                <p className="text-rose-600 font-medium">
                  8:00 PM
                </p>

                <h3 className="font-serif text-2xl text-rose-900">
                  Guests arrive
                </h3>

                <p className="text-stone-600 mt-1">
                  Welcome, smiles and beautiful memories.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-center bg-white rounded-3xl p-6 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Heart
                  className="text-rose-600"
                  fill="currentColor"
                />
              </div>

              <div>
                <p className="text-rose-600 font-medium">
                  The celebration
                </p>

                <h3 className="font-serif text-2xl text-rose-900">
                  Eng.Moamen & Marwa
                </h3>

                <p className="text-stone-600 mt-1">
                  Celebrating love, family and friendship.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-center bg-white rounded-3xl p-6 shadow-sm">
              <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Flower2 className="text-rose-600" />
              </div>

              <div>
                <p className="text-rose-600 font-medium">
                  All evening
                </p>

                <h3 className="font-serif text-2xl text-rose-900">
                  Food, music & memories
                </h3>

                <p className="text-stone-600 mt-1">
                  Let's celebrate together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOCATION
      ===================================================== */}

      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <MapPin
              className="mx-auto text-rose-500 mb-5"
              size={42}
            />

            <p className="uppercase tracking-[0.3em] text-sm text-rose-500 mb-4">
              Come celebrate with us
            </p>

            <h2 className="font-serif text-5xl md:text-6xl text-rose-900">
              Moon Side
            </h2>

            <p className="text-stone-600 mt-4 text-lg">
              Al Mina
            </p>
          </div>

          <div className="rounded-3xl overflow-hidden shadow-lg">
            <iframe
              title="Wedding location"
              src="https://www.google.com/maps?q=Al%20Mina%20Lebanon&output=embed"
              className="w-full h-96 border-0"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          GIFT / WHISH MONEY
      ===================================================== */}

      <section className="py-24 px-6 bg-rose-50">
        <div className="max-w-3xl mx-auto text-center">
          <Gift
            className="mx-auto text-rose-500 mb-6"
            size={46}
          />

          <p className="uppercase tracking-[0.3em] text-sm text-rose-500 mb-4">
            A little gift
          </p>

          <h2 className="font-serif text-5xl md:text-6xl text-rose-900 mb-6">
            Your presence is enough
          </h2>

          <p className="text-stone-600 text-lg leading-relaxed mb-10">
            If you would like to send us a gift, you can use
            Whish Money.
          </p>

          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md mx-auto">
            <p className="text-sm uppercase tracking-widest text-stone-500 mb-3">
              Whish Money
            </p>

            <p className="font-serif text-3xl text-rose-900 mb-6">
              70 281 504
            </p>

            <button
              onClick={() => copyText("70 281 504")}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                bg-rose-600
                hover:bg-rose-700
                text-white
                px-6
                py-3
                rounded-full
                transition
              "
            >
              <Copy size={18} />
              Copy Number
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          RSVP
      ===================================================== */}

      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Send
              className="mx-auto text-rose-500 mb-6"
              size={42}
            />

            <p className="uppercase tracking-[0.3em] text-sm text-rose-500 mb-4">
              We would love to know
            </p>

            <h2 className="font-serif text-5xl md:text-6xl text-rose-900">
              Will you join us?
            </h2>

            <p className="text-stone-600 mt-5">
              Please let us know if you can celebrate with us.
            </p>
          </div>

          {/* Already responded */}
          {alreadyResponded && !submitted && (
            <div className="bg-rose-50 rounded-3xl p-8 text-center">
              <Check
                className="mx-auto text-green-600 mb-4"
                size={48}
              />

              <h3 className="font-serif text-3xl text-rose-900 mb-3">
                Thank you, {guestName} ❤️
              </h3>

              <p className="text-stone-600">
                You have already responded to this invitation.
              </p>
            </div>
          )}

          {/* Submitted */}
          {submitted && (
            <div className="bg-rose-50 rounded-3xl p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Check
                  className="text-green-600"
                  size={42}
                />
              </div>

              <h3 className="font-serif text-4xl text-rose-900 mb-4">
                Thank you, {guestName}! ❤️
              </h3>

              <p className="text-lg text-stone-600">
                {submittedAnswer === "yes"
                  ? "We can't wait to celebrate with you!"
                  : "We're sorry you won't be able to join us, but thank you for letting us know."}
              </p>

              <div className="mt-6 text-4xl">
                {submittedAnswer === "yes" ? "🥂 🌸 💕" : "❤️ 🌷"}
              </div>
            </div>
          )}

          {/* RSVP Form */}
          {!alreadyResponded && !submitted && (
            <form
              onSubmit={submitRSVP}
              className="bg-rose-50 rounded-3xl p-6 md:p-10"
            >
              {/* Name */}
              <div className="mb-7">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Your name
                </label>

                <div className="bg-white rounded-2xl px-5 py-4 text-stone-700">
                  {guestName}
                </div>
              </div>

              {/* Attendance */}
              <div className="mb-7">
                <label className="block text-sm font-medium text-stone-700 mb-3">
                  Will you attend?
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAttending("yes")}
                    className={`rounded-2xl p-5 border-2 transition ${attending === "yes"
                      ? "border-rose-600 bg-rose-100 text-rose-900"
                      : "border-white bg-white hover:border-rose-200"
                      }`}
                  >
                    <Heart
                      className="mx-auto mb-2"
                      size={28}
                      fill={
                        attending === "yes"
                          ? "currentColor"
                          : "none"
                      }
                    />

                    <span className="font-medium">
                      Yes, I'll be there
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAttending("no")}
                    className={`rounded-2xl p-5 border-2 transition ${attending === "no"
                      ? "border-rose-600 bg-rose-100 text-rose-900"
                      : "border-white bg-white hover:border-rose-200"
                      }`}
                  >
                    <MessageCircle
                      className="mx-auto mb-2"
                      size={28}
                    />

                    <span className="font-medium">
                      Sorry, I can't
                    </span>
                  </button>
                </div>
              </div>

              {/* Seats */}
              {attending === "yes" && (
                <div className="mb-7">
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                    <Users size={17} />
                    Number of seats
                  </label>

                  <select
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    className="
                      w-full
                      bg-white
                      rounded-2xl
                      px-5
                      py-4
                      border-0
                      outline-none
                      focus:ring-2
                      focus:ring-rose-300
                    "
                  >
                    <option value="1">1 seat</option>
                    <option value="2">2 seats</option>
                    <option value="3">3 seats</option>
                    <option value="4">4 seats</option>
                    <option value="5">5 seats</option>
                  </select>
                </div>
              )}

              {/* Message */}
              <div className="mb-7">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  A message for the couple
                  <span className="text-stone-400 font-normal">
                    {" "}
                    (optional)
                  </span>
                </label>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Write something beautiful..."
                  className="
                    w-full
                    bg-white
                    rounded-2xl
                    px-5
                    py-4
                    border-0
                    outline-none
                    resize-none
                    focus:ring-2
                    focus:ring-rose-300
                  "
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="
                  w-full
                  bg-rose-600
                  hover:bg-rose-700
                  disabled:bg-rose-300
                  text-white
                  py-4
                  rounded-full
                  font-medium
                  flex
                  items-center
                  justify-center
                  gap-3
                  transition
                "
              >
                {isSubmitting ? (
                  "Sending..."
                ) : (
                  <>
                    <Send size={18} />
                    Send RSVP
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* =====================================================
          FINAL MESSAGE
      ===================================================== */}

      <section className="py-28 px-6 bg-rose-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <Heart
            className="mx-auto text-rose-200 mb-7"
            size={44}
            fill="currentColor"
          />

          <h2 className="font-serif text-5xl md:text-7xl mb-8">
            We can't wait to celebrate with you
          </h2>

          <p className="text-rose-100 text-lg leading-relaxed">
            Your presence will make our special day even more
            meaningful.
          </p>

          <div className="flex justify-center items-center gap-4 mt-10 text-3xl">
            🌸
            <Heart fill="currentColor" />
            🌸
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-rose-950 text-rose-200 py-10 px-6 text-center">
        <p className="font-serif text-3xl mb-3">
          Eng.Moamen & Marwa
        </p>

        <p className="text-sm">
          16 • 10 • 2026
        </p>

        <p className="text-xs text-rose-400 mt-6">
          Made with love ❤️
        </p>
      </footer>
    </div>
  );
}

export default App;