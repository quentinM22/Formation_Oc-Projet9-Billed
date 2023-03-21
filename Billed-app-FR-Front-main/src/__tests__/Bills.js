/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"

import mockStore from "../__mocks__/store.js"

import router from "../app/Router.js"
import Bills from "../containers/Bills.js"

describe("Given I am connected as an employee", () => {
	describe("When I am on Bills Page", () => {
		// Test Unitaire: icon-window
		// Modif (Expect: Ajouté)
		test("Then bill icon in vertical layout should be highlighted", async () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock })
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			)
			const root = document.createElement("div")
			root.setAttribute("id", "root")
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.Bills)

			await waitFor(() => screen.getByTestId("icon-window"))
			const windowIcon = screen.getByTestId("icon-window")
			//to-do write expect expression
			expect(windowIcon.classList.contains("active-icon")).toBe(true)
		})
		// Test unitaire: Bills moins ancien au plus ancien
		test("Then bills should be ordered from earliest to latest", () => {
			document.body.innerHTML = BillsUI({ data: bills })
			const dates = screen
				.getAllByText(
					/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
				)
				.map((a) => a.innerHTML)
			const antiChrono = (a, b) => (a < b ? 1 : -1)
			const datesSorted = [...dates].sort(antiChrono)
			expect(dates).toEqual(datesSorted)
		})
		// Test unitaire: Path Nouveau Bill
		// Ajout
		// Test commenté
		test("Then  Envoyer vers la nouvelle page de bill", () => {
			// Simulation de présence d'un Objet dans le localStorage
			Object.defineProperty(window, "localStorage", { value: localStorageMock })
			// Stockage d'un user employee dans le localstorage
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			)
			// Générer un bills html
			document.body.innerHTML = BillsUI({ data: bills })
			// Chemin de navigation
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname })
			}
			// Création d'instance Bills 
			// Paramètre pour nécessaire pour le test
			const mockBills = new Bills({
				document,
				onNavigate,
				localStorage,
				store: null,
			})
			// Récuperation du bouton dans la page
			const btnNewBill = screen.getByTestId("btn-new-bill")
			// Simulation Jest de la fonction "handleClickNewBill"
			const mockFunctionHandleClick = jest.fn(mockBills.handleClickNewBill)
			// Fonction testé
			btnNewBill.addEventListener("click", mockFunctionHandleClick)
			fireEvent.click(btnNewBill) //Simulation click sur le bouton
 			// Test
			expect(mockFunctionHandleClick).toHaveBeenCalled()
			expect(mockFunctionHandleClick).toHaveBeenCalledTimes(1)
		})
		// Test unitaire: IconEye modal
		// Ajout
		// Test commenté
		test("Then Click sur IconEye", () => {
			// Simulation de présence d'un Objet dans le localStorage
			Object.defineProperty(window, localStorage, { value: localStorageMock })
			// Stockage d'un user employee dans le localstorage
			window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
			// Création d'instance Bills 
			// Paramètre pour nécessaire pour le test
			const html = BillsUI({ data: bills })
			document.body.innerHTML = html
			// Chemin de navigation
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname })
			}
			// Création d'instance Bills 
			// Paramètre pour nécessaire pour le test
			const billsContainer = new Bills({
				document,
				onNavigate,
				localStorage: localStorageMock,
				store: null,
			})
			// Simulation function d'ouverture de modal
			// Contrôle de l'apelle de la méthode
			$.fn.modal = jest.fn()

			const handleClickIconEye = jest.fn(() => {
				billsContainer.handleClickIconEye
			})
			// Récuperation du boutton[0] "Eye" 
			const firstEyeIcon = screen.getAllByTestId("icon-eye")[0]
			// Fonction testé	
			firstEyeIcon.addEventListener("click", handleClickIconEye)
			fireEvent.click(firstEyeIcon) //Simulation click sur le bouton
			// Test
			expect(handleClickIconEye).toHaveBeenCalled()
			expect($.fn.modal).toHaveBeenCalled()
		})
	})
})
// Test intégration: Get Bills
// Ajout
describe("Given I am a user connected as Employee", () => {
	describe("When Je suis sur la page Bill", () => {
		// test: Rucuperation Api simulé GET
		// Test commenté
		test("fetches bills from mock API GET", async () => {
			// Stockage d'un user employee dans le localstorage
			localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
			// Création élément Html root  
			// Mise en place de root dans le corps de page
			const root = document.createElement("div")
			root.setAttribute("id", "root")
			document.body.append(root)
			// Initialisation du router
			router()
			// Navigation vers page Bills
			window.onNavigate(ROUTES_PATH.Bills)
			// Test bill _mocks_
			expect(screen.findByText("test3")).toBeTruthy()
		})
		describe("When an error occurs on API", () => {
			beforeEach(() => {
				jest.spyOn(mockStore, "bills")
				Object.defineProperty(window, "localStorage", {
					value: localStorageMock,
				})
				window.localStorage.setItem(
					"user",
					JSON.stringify({
						type: "Employee",
						email: "a@a",
					})
				)
				const root = document.createElement("div")
				root.setAttribute("id", "root")
				document.body.appendChild(root)
				router()
			})
			// Test unitaire: Erreur 404
			test("fetches bills from an API and fails with 404 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 404"))
						},
					}
				})
				const errorWindow = BillsUI({ error: "Erreur 404" })
				document.body.innerHTML = errorWindow
				const message = await screen.getByText(/Erreur 404/)
				expect(message).toBeTruthy()
			})

			// Test unitaire: Erreur 500
			test("fetches messages from an API and fails with 500 message error", async () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 500"))
						},
					}
				})

				const errorWindow = BillsUI({ error: "Erreur 500" })
				document.body.innerHTML = errorWindow
				const message = await screen.getByText(/Erreur 500/)
				expect(message).toBeTruthy()
			})
		})
	})
})
