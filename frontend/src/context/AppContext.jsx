import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  api
} from "../services/api";

const AppContext =
  createContext(null);

function getLocalDateKey() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

export function AppProvider({
  children
}) {
  const [
    sessionLoading,
    setSessionLoading
  ] =
    useState(true);

  const [
    user,
    setUser
  ] =
    useState(null);

  const [
    profiles,
    setProfiles
  ] =
    useState([]);

  const [
    profilesLoading,
    setProfilesLoading
  ] =
    useState(true);

  const [
    selectedProfileId,
    setSelectedProfileId
  ] =
    useState(null);

  const [
    selectedProfile,
    setSelectedProfile
  ] =
    useState(null);

  const [
    weightHistory,
    setWeightHistory
  ] =
    useState([]);

  const [
    nutritionDate,
    setNutritionDate
  ] =
    useState(
      getLocalDateKey
    );

  const [
    nutritionLogs,
    setNutritionLogs
  ] =
    useState([]);

  const [
    nutritionTotals,
    setNutritionTotals
  ] =
    useState({
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
    });

  const [
    globalError,
    setGlobalError
  ] =
    useState("");

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    if (
      user?.user_id
    ) {
      refreshProfiles(
        user.user_id
      );
    } else {
      setProfiles([]);
      setSelectedProfileId(
        null
      );
      setSelectedProfile(
        null
      );
      setWeightHistory([]);
      setNutritionLogs([]);
      setNutritionTotals({
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
      });
      setProfilesLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (
      selectedProfileId
    ) {
      refreshSelectedProfile(
        selectedProfileId
      );

      refreshWeightHistory(
        selectedProfileId
      );

      refreshNutritionDay(
        nutritionDate,
        selectedProfileId
      );
    } else {
      setSelectedProfile(
        null
      );
      setWeightHistory([]);
      setNutritionLogs([]);
      setNutritionTotals({
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
      });
    }
  }, [
    selectedProfileId,
    nutritionDate
  ]);

  async function initializeSession() {
    try {
      setSessionLoading(true);
      setGlobalError("");

      const data =
        await api.me();

      setUser(
        data.user
      );
    } catch (error) {
      if (
        error.status !== 401
      ) {
        setGlobalError(
          error.message
        );
      }

      setUser(null);
    } finally {
      setSessionLoading(false);
    }
  }

  async function refreshProfiles(
    explicitUserId =
      user?.user_id
  ) {
    if (
      !explicitUserId
    ) {
      return [];
    }

    try {
      setProfilesLoading(true);

      const data =
        await api.getProfiles(
          explicitUserId
        );

      setProfiles(
        data
      );

      setSelectedProfileId(
        (current) => {
          if (
            current &&
            data.some(
              (profile) =>
                Number(
                  profile.profile_id
                ) ===
                Number(
                  current
                )
            )
          ) {
            return current;
          }

          return (
            data[0]
              ?.profile_id ||
            null
          );
        }
      );

      return data;
    } catch (error) {
      setGlobalError(
        error.message
      );

      return [];
    } finally {
      setProfilesLoading(false);
    }
  }

  async function refreshSelectedProfile(
    profileId =
      selectedProfileId
  ) {
    if (!profileId) {
      return null;
    }

    try {
      const data =
        await api.getProfile(
          profileId
        );

      setSelectedProfile(
        data
      );

      return data;
    } catch (error) {
      setGlobalError(
        error.message
      );

      return null;
    }
  }

  async function refreshWeightHistory(
    profileId =
      selectedProfileId
  ) {
    if (!profileId) {
      return [];
    }

    try {
      const data =
        await api
          .getWeightHistory(
            profileId
          );

      const sorted =
        [...data].sort(
          (a, b) =>
            new Date(
              a.recorded_date
            ) -
            new Date(
              b.recorded_date
            )
        );

      setWeightHistory(
        sorted
      );

      return sorted;
    } catch (error) {
      setGlobalError(
        error.message
      );

      return [];
    }
  }

  async function refreshNutritionDay(
    date =
      nutritionDate,
    profileId =
      selectedProfileId
  ) {
    if (!profileId) {
      return {
        logs: [],
        totals: null
      };
    }

    try {
      const [
        logs,
        totals
      ] =
        await Promise.all([
          api.getNutritionLogs(
            profileId,
            date
          ),
          api.getNutritionTotals(
            profileId,
            date
          )
        ]);

      setNutritionLogs(
        logs
      );

      setNutritionTotals(
        totals
      );

      return {
        logs,
        totals
      };
    } catch (error) {
      setGlobalError(
        error.message
      );

      return {
        logs: [],
        totals: null
      };
    }
  }

  async function saveNutritionLog(
    payload
  ) {
    if (
      !selectedProfileId
    ) {
      throw new Error(
        "Select a profile first"
      );
    }

    const result =
      await api.saveNutritionLog(
        selectedProfileId,
        payload
      );

    await refreshNutritionDay();

    return result;
  }

  async function deleteNutritionLog(
    logId
  ) {
    if (
      !selectedProfileId
    ) {
      throw new Error(
        "Select a profile first"
      );
    }

    const result =
      await api.deleteNutritionLog(
        selectedProfileId,
        logId
      );

    await refreshNutritionDay();

    return result;
  }

  async function login(
    credentials
  ) {
    const data =
      await api.login(
        credentials
      );

    setUser(
      data.user
    );

    return data.user;
  }

  async function register(
    values
  ) {
    const data =
      await api.register(
        values
      );

    setUser(
      data.user
    );

    return data.user;
  }

  async function logout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
      setProfiles([]);
      setSelectedProfileId(
        null
      );
      setSelectedProfile(
        null
      );
      setWeightHistory([]);
      setNutritionLogs([]);
      setNutritionTotals({
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
      });
    }
  }

  async function createProfile(
    payload
  ) {
    if (
      !user?.user_id
    ) {
      throw new Error(
        "Login required"
      );
    }

    const result =
      await api.createProfile(
        user.user_id,
        payload
      );

    const updated =
      await refreshProfiles(
        user.user_id
      );

    const newProfileId =
      result.profile_id;

    if (
      newProfileId
    ) {
      setSelectedProfileId(
        newProfileId
      );
    } else if (
      updated[0]
        ?.profile_id
    ) {
      setSelectedProfileId(
        updated[0]
          .profile_id
      );
    }

    return result;
  }

  async function updateSelectedProfile(
    payload
  ) {
    if (
      !selectedProfileId
    ) {
      throw new Error(
        "Select a profile first"
      );
    }

    const result =
      await api.updateProfile(
        selectedProfileId,
        payload
      );

    await Promise.all([
      refreshProfiles(),
      refreshSelectedProfile()
    ]);

    return result;
  }

  async function deleteSelectedProfile() {
    if (
      !selectedProfileId
    ) {
      return;
    }

    await api.deleteProfile(
      selectedProfileId
    );

    setSelectedProfileId(
      null
    );

    await refreshProfiles();
  }

  async function addWeight(
    payload
  ) {
    if (
      !selectedProfileId
    ) {
      throw new Error(
        "Select a profile first"
      );
    }

    const result =
      await api.addWeight(
        selectedProfileId,
        payload
      );

    await Promise.all([
      refreshSelectedProfile(),
      refreshWeightHistory(),
      refreshProfiles()
    ]);

    return result;
  }

  const value =
    useMemo(
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
        selectProfile:
          setSelectedProfileId
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
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context =
    useContext(
      AppContext
    );

  if (!context) {
    throw new Error(
      "useApp must be used inside AppProvider"
    );
  }

  return context;
}
