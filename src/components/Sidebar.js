"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";

import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Brain,
  Lightbulb,
  Newspaper,
  LineChart,
  MessageCircle,
  Calendar,
  Settings,
  LogOut,
  Bot,
} from "lucide-react";

export default function Sidebar({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  // ==========================
  // MENU CONFIG
  // ==========================

  const allMenuItems = {
    admin: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        route: "/admin",
      },
      {
        name: "Projects",
        icon: FolderKanban,
        route: "/projects",
      },
      {
        name: "Team",
        icon: Users,
        route: "/team",
      },
      {
        name: "Research Hub",
        icon: Brain,
        route: "/research",
      },
      {
        name: "Ideas Board",
        icon: Lightbulb,
        route: "/ideas",
      },
      {
        name: "Competitor News",
        icon: Newspaper,
        route: "/competitors",
      },
      {
        name: "Market Analysis",
        icon: LineChart,
        route: "/market",
      },
      {
        name: "Team Chat",
        icon: MessageCircle,
        route: "/chat",
      },
      {
        name: "Calendar",
        icon: Calendar,
        route: "/calendar",
      },

      // AI ASSISTANT
      {
        name: "AI Assistant",
        icon: Bot,
        route: "/ai-assistant",
      },

      {
        name: "Settings",
        icon: Settings,
        route: "/settings",
      },
    ],

    // ==========================
    // USER ROUTES
    // ==========================

    user: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        route: "/dashboard",
      },
      {
        name: "My Projects",
        icon: FolderKanban,
        route: "/projects",
      },

      // NEW COMPETITOR NEWS
      {
        name: "Competitor News",
        icon: Newspaper,
        route: "/competitors",
      },

      {
        name: "Calendar",
        icon: Calendar,
        route: "/calendar",
      },
      {
        name: "Team Chat",
        icon: MessageCircle,
        route: "/chat",
      },
      {
        name: "Market Analysis",
        icon: LineChart,
        route: "/market",
      },
      {
        name: "Research Hub",
        icon: Brain,
        route: "/research",
      },
      {
        name: "Ideas",
        icon: Lightbulb,
        route: "/ideas",
      },

      // AI ASSISTANT
      {
        name: "AI Assistant",
        icon: Bot,
        route: "/ai-assistant",
      },

      {
        name: "Settings",
        icon: Settings,
        route: "/settings",
      },
    ],
  };

  // ==========================
  // ROLE
  // ==========================

  const userRole =
    user?.role === "admin"
      ? "admin"
      : "user";

  const menuItems =
    allMenuItems[userRole];

  // ==========================
  // LOGOUT
  // ==========================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.replace("/login");
  };

  return (
    <aside
      className="
      w-[280px]
      min-h-screen
      sticky top-0
      flex flex-col
      justify-between
      border-r border-white/10

      bg-gradient-to-b
      from-[#1B1F7A]
      via-[#312E81]
      to-[#581C87]

      shadow-[0_0_40px_rgba(124,58,237,.15)]
    "
    >
      {/* TOP */}

      <div>
        {/* LOGO */}

        <div className="pt-10 pb-8 px-6 text-center">
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="MEYO"
              width={160}
              height={160}
              priority
              className="
              object-contain
              drop-shadow-[0_0_35px_rgba(139,92,246,.5)]
            "
            />
          </div>

          <h1 className="text-[28px] font-bold text-white mt-2">
            MEYO
          </h1>

          <p className="text-[#94A3B8] text-sm mt-2">
            {userRole === "admin"
              ? "Admin Portal"
              : "User Portal"}
          </p>
        </div>

        {/* MENU */}

        <div className="px-4 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;

            const active =
              pathname === item.route;

            return (
              <button
                key={index}
                onClick={() =>
                  router.push(item.route)
                }
                className={`
                  w-full
                  flex
                  items-center
                  gap-4
                  px-5
                  py-4
                  rounded-2xl
                  transition-all
                  duration-300
                  group

                  ${
                    active
                      ? `
                        bg-gradient-to-r
                        from-[#7C3AED]
                        via-[#2563EB]
                        to-[#22C55E]

                        text-white

                        shadow-[0_0_25px_rgba(59,130,246,.25)]

                        scale-[1.02]
                      `
                      : `
                        text-[#CBD5E1]

                        hover:bg-white/10

                        hover:text-white
                      `
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`
                    ${
                      active
                        ? "text-white"
                        : "text-[#94A3B8] group-hover:text-white"
                    }
                  `}
                />

                <span className="font-medium text-sm">
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BOTTOM */}

      <div className="p-5 border-t border-white/10">
        <div
          className="
          flex items-center
          gap-3
          bg-white/5
          rounded-2xl
          p-3
          mb-4
        "
        >
          <div
            className="
            w-12 h-12
            rounded-full

            bg-gradient-to-r
            from-[#7C3AED]
            via-[#2563EB]
            to-[#22C55E]

            flex
            items-center
            justify-center

            font-bold
            text-white
          "
          >
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() ||
              user?.email
                ?.charAt(0)
                ?.toUpperCase() ||
              "U"}
          </div>

          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm text-white font-semibold truncate">
              {user?.name || "User"}
            </h3>

            <p className="text-xs text-[#94A3B8] truncate">
              {user?.email}
            </p>

            <span
              className={`
              inline-block
              mt-1
              px-2
              py-[2px]
              rounded-full
              text-[10px]

              ${
                userRole === "admin"
                  ? "bg-purple-500/20 text-purple-300"
                  : "bg-blue-500/20 text-blue-300"
              }
            `}
            >
              {userRole === "admin"
                ? "Administrator"
                : "Team Member"}
            </span>
          </div>
        </div>

        {/* LOGOUT */}

        <button
          onClick={logout}
          className="
          w-full
          py-4
          rounded-2xl

          bg-red-500/10
          border border-red-500/20

          text-red-300

          flex
          items-center
          justify-center
          gap-2

          hover:bg-red-500/20
          hover:scale-[1.02]

          transition-all
        "
        >
          <LogOut size={18} />

          Logout
        </button>
      </div>
    </aside>
  );
}