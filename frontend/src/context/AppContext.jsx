import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { api } from "../services/api";

const AppContext = createContext(null);

function getLocalDateKey() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyNutritionTotals() {
  return {
    totals: {
      item_count: 0,
      calories: 0,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      potassium_mg: 0,
      sodium_mg: 0
    },
    meals: {}
  };
}

export function AppProvider({ children }) {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);

  const [selectedProfileId, setSelectedProfileId] =
    useState(null);

  const [selectedProfile, setSelectedProfile] =
    useState(null);

  const [weightHistory, setWeightHistory] = useState([]);

  const [nutritionDate, setNutritionDate] =
    useState(getLocalDateKey);

  const [nutritionLogs, setNutritionLogs] = useState([]);

  const [nutritionTotals, setNutritionTotals] =
    useState(emptyNutritionTotals);

  const [globalError, setGlobalError] = useState("");

  const activeAccount = useRef({
    userId: null,
    generation: 0
  });

  const activeSelection = useRef({
    userId: null,
    profileId: null,
    date: null,
    generation: 0
  });

  const latestRequest = useRef({
    profiles: 0,
    profile: 0,
    weight: 0,
    nutrition: 0
  });

  const sessionRequest = useRef(0);

  // Invalidate requests belonging to an earlier account.
  useLayoutEffect(() => {
    activeAccount.current = {
      userId: user?.user_id ?? null,
      generation: activeAccount.current.generation + 1
    };

    setProfiles([]);
    setSelectedProfileId(null);
    setProfilesLoading(Boolean(user?.user_id));

    return () => {
      activeAccount.current = {
        ...activeAccount.current,
        generation: activeAccount.current.generation + 1
      };
    };
  }, [user?.user_id]);

  // Invalidate data requests whenever the selection changes.
  useLayoutEffect(() => {
    activeSelection.current = {
      userId: user?.user_id ?? null,
      profileId: selectedProfileId,
      date: nutritionDate,
      generation: activeSelection.current.generation + 1
    };

    clearProfileData();

    const profileBelongsToAccount = profiles.some(
      (profile) =>
        Number(profile.profile_id) ===
          Number(selectedProfileId) &&
        Number(profile.user_id) === Number(user?.user_id)
    );

    if (
      user?.user_id &&
      selectedProfileId &&
      profileBelongsToAccount
    ) {
      refreshSelectedProfile(selectedProfileId);
      refreshWeightHistory(selectedProfileId);

      refreshNutritionDay(
        nutritionDate,
        selectedProfileId
      );
    }

    return () => {
      activeSelection.current = {
        ...activeSelection.current,
        generation: activeSelection.current.generation + 1
      };
    };
  }, [
    user?.user_id,
    selectedProfileId,
    nutritionDate
  ]);

  useEffect(() => {
    initializeSession();

    return () => {
      sessionRequest.current += 1;
    };
  }, []);

  useEffect(() => {
    if (user?.user_id) {
      refreshProfiles(user.user_id);
    }
  }, [user?.user_id]);

  function clearProfileData() {
    setSelectedProfile(null);
    setWeightHistory([]);
    setNutritionLogs([]);
    setNutritionTotals(emptyNutritionTotals());
  }

  function accountMatches(userId, generation) {
    return (
      userId != null &&
      Number(userId) ===
        Number(activeAccount.current.userId) &&
      generation === activeAccount.current.generation
    );
  }

  function requireCurrentProfile() {
    const profileId = Number(selectedProfileId);

    const accountIsCurrent =
      user?.user_id != null &&
      Number(user.user_id) ===
        Number(activeAccount.current.userId);

    const profileIsCurrent =
      selectedProfileId != null &&
      Number.isInteger(profileId) &&
      profileId > 0 &&
      profileId ===
        Number(activeSelection.current.profileId);

    if (!accountIsCurrent || !profileIsCurrent) {
      throw new Error(
        "The selected profile changed. Wait for its details to load."
      );
    }

    return profileId;
  }

  async function initializeSession() {
    const requestId = ++sessionRequest.current;

    try {
      setSessionLoading(true);
      setGlobalError("");

      const data = await api.me();

      if (requestId !== sessionRequest.current) {
        return;
      }

      setUser(data.user);
    } catch (error) {
      if (requestId !== sessionRequest.current) {
        return;
      }

      if (error.status !== 401) {
        setGlobalError(error.message);
      }

      setUser(null);
    } finally {
      if (requestId === sessionRequest.current) {
        setSessionLoading(false);
      }
    }
  }

  async function refreshProfiles(
    explicitUserId = user?.user_id
  ) {
    const generation = activeAccount.current.generation;

    if (!accountMatches(explicitUserId, generation)) {
      return [];
    }

    const requestId = ++latestRequest.current.profiles;

    const isCurrentRequest = () =>
      accountMatches(explicitUserId, generation) &&
      requestId === latestRequest.current.profiles;

    try {
      setProfilesLoading(true);

      const data = await api.getProfiles(explicitUserId);

      if (!isCurrentRequest()) {
        return [];
      }

      setProfiles(data);

      setSelectedProfileId((current) => {
        const currentStillExists = data.some(
          (profile) =>
            Number(profile.profile_id) === Number(current)
        );

        if (current != null && currentStillExists) {
          return current;
        }

        return data[0]?.profile_id ?? null;
      });

      return data;
    } catch (error) {
      if (isCurrentRequest()) {
        setGlobalError(error.message);
      }

      return [];
    } finally {
      if (isCurrentRequest()) {
        setProfilesLoading(false);
      }
    }
  }

  async function loadForSelection({
    kind,
    profileId,
    date,
    fetchData,
    applyData
  }) {
    const requestedUserId = user?.user_id;
    const generation = activeSelection.current.generation;

    function selectionMatches() {
      const current = activeSelection.current;

      return (
        requestedUserId != null &&
        profileId != null &&
        Number(requestedUserId) === Number(current.userId) &&
        Number(requestedUserId) ===
          Number(activeAccount.current.userId) &&
        Number(profileId) === Number(current.profileId) &&
        (
          kind !== "nutrition" ||
          date === current.date
        )
      );
    }

    if (!selectionMatches()) {
      return null;
    }

    const requestId = ++latestRequest.current[kind];

    function isCurrentRequest() {
      return (
        selectionMatches() &&
        generation === activeSelection.current.generation &&
        requestId === latestRequest.current[kind]
      );
    }

    try {
      const data = await fetchData();

      if (!isCurrentRequest()) {
        return null;
      }

      applyData(data);
      return data;
    } catch (error) {
      if (isCurrentRequest()) {
        setGlobalError(error.message);
      }

      return null;
    }
  }

  async function refreshSelectedProfile(
    profileId = selectedProfileId
  ) {
    return loadForSelection({
      kind: "profile",
      profileId,

      fetchData: () => api.getProfile(profileId),

      applyData: (profile) => {
        setSelectedProfile(profile);
      }
    });
  }

  async function refreshWeightHistory(
    profileId = selectedProfileId
  ) {
    const records = await loadForSelection({
      kind: "weight",
      profileId,

      fetchData: async () => {
        const data = await api.getWeightHistory(profileId);

        return [...data].sort((a, b) => {
          const dateDifference =
            new Date(a.recorded_date) -
            new Date(b.recorded_date);

          return (
            dateDifference ||
            Number(a.weight_id) - Number(b.weight_id)
          );
        });
      },

      applyData: (history) => {
        setWeightHistory(history);
      }
    });

    return records ?? [];
  }

  async function refreshNutritionDay(
    date = nutritionDate,
    profileId = selectedProfileId
  ) {
    const result = await loadForSelection({
      kind: "nutrition",
      profileId,
      date,

      fetchData: async () => {
        const [logs, totals] = await Promise.all([
          api.getNutritionLogs(profileId, date),
          api.getNutritionTotals(profileId, date)
        ]);

        return { logs, totals };
      },

      applyData: ({ logs, totals }) => {
        setNutritionLogs(logs);
        setNutritionTotals(totals);
      }
    });

    return result ?? {
      logs: [],
      totals: null
    };
  }

  async function saveNutritionLog(payload) {
    const profileId = requireCurrentProfile();

    const result = await api.saveNutritionLog(
      profileId,
      payload
    );

    await refreshNutritionDay(
      nutritionDate,
      profileId
    );

    return result;
  }

  async function deleteNutritionLog(logId) {
    const profileId = requireCurrentProfile();

    const result = await api.deleteNutritionLog(
      profileId,
      logId
    );

    await refreshNutritionDay(
      nutritionDate,
      profileId
    );

    return result;
  }

  async function login(credentials) {
    const data = await api.login(credentials);

    sessionRequest.current += 1;
    setGlobalError("");
    setUser(data.user);

    return data.user;
  }

  async function register(values) {
    const data = await api.register(values);

    sessionRequest.current += 1;
    setGlobalError("");
    setUser(data.user);

    return data.user;
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      sessionRequest.current += 1;

      // Immediately invalidate pending account requests.
      activeAccount.current = {
        userId: null,
        generation: activeAccount.current.generation + 1
      };

      activeSelection.current = {
        userId: null,
        profileId: null,
        date: null,
        generation: activeSelection.current.generation + 1
      };

      setUser(null);
      setProfiles([]);
      setProfilesLoading(false);
      setSelectedProfileId(null);
      clearProfileData();
      setGlobalError("");
    }
  }

  async function createProfile(payload) {
    const userId = user?.user_id;
    const generation = activeAccount.current.generation;

    if (!accountMatches(userId, generation)) {
      throw new Error("Login required");
    }

    const result = await api.createProfile(
      userId,
      payload
    );

    if (!accountMatches(userId, generation)) {
      return result;
    }

    const updated = await refreshProfiles(userId);

    if (!accountMatches(userId, generation)) {
      return result;
    }

    const newProfile = updated.find(
      (profile) =>
        Number(profile.profile_id) ===
          Number(result.profile_id)
    );

    if (newProfile) {
      setSelectedProfileId(newProfile.profile_id);
    }

    return result;
  }

  async function updateSelectedProfile(
    payload,
    formProfileId
  ) {
    const profileId = requireCurrentProfile();
    const formOwnerId = Number(formProfileId);

    if (
      !Number.isInteger(formOwnerId) ||
      formOwnerId <= 0 ||
      formOwnerId !== profileId
    ) {
      throw new Error(
        "The selected profile changed. Wait for its details to load before saving."
      );
    }

    const userId = user?.user_id;
    const generation = activeAccount.current.generation;

    const result = await api.updateProfile(
      profileId,
      payload
    );

    if (!accountMatches(userId, generation)) {
      return result;
    }

    await Promise.all([
      refreshProfiles(userId),
      refreshSelectedProfile(profileId)
    ]);

    return result;
  }

  async function deleteSelectedProfile() {
    if (!selectedProfileId) {
      return;
    }

    const profileId = requireCurrentProfile();
    const userId = user?.user_id;
    const generation = activeAccount.current.generation;

    await api.deleteProfile(profileId);

    if (!accountMatches(userId, generation)) {
      return;
    }

    // Do not clear a different profile selected during deletion.
    setSelectedProfileId((current) =>
      Number(current) === profileId ? null : current
    );

    await refreshProfiles(userId);
  }

  async function addWeight(payload) {
    const profileId = requireCurrentProfile();
    const userId = user?.user_id;
    const generation = activeAccount.current.generation;

    const result = await api.addWeight(
      profileId,
      payload
    );

    if (!accountMatches(userId, generation)) {
      return result;
    }

    await Promise.all([
      refreshSelectedProfile(profileId),
      refreshWeightHistory(profileId),
      refreshProfiles(userId)
    ]);

    return result;
  }

  const value = useMemo(
    () => ({
      sessionLoading,
      profilesLoading,
      user,
      profiles,
      selectedProfileId,
      selectedProfile,
      weightHistory,
      nutritionDate,
      nutritionLogs,
      nutritionTotals,
      globalError,
      setGlobalError,
      login,
      register,
      logout,
      refreshProfiles,
      refreshSelectedProfile,
      refreshWeightHistory,
      refreshNutritionDay,
      saveNutritionLog,
      deleteNutritionLog,
      setNutritionDate,
      createProfile,
      updateSelectedProfile,
      deleteSelectedProfile,
      addWeight,
      selectProfile: setSelectedProfileId
    }),
    [
      sessionLoading,
      profilesLoading,
      user,
      profiles,
      selectedProfileId,
      selectedProfile,
      weightHistory,
      nutritionDate,
      nutritionLogs,
      nutritionTotals,
      globalError
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used inside AppProvider"
    );
  }

  return context;
}