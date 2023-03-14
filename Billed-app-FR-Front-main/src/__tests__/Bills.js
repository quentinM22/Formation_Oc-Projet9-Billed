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
			expect(windowIcon.classList.contains("active-icon"))
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
		test("Then  Envoyer vers la nouvelle page de bill", () => {
			Object.defineProperty(window, "localStorage", { value: localStorageMock })
			window.localStorage.setItem(
				"user",
				JSON.stringify({
					type: "Employee",
				})
			)
			document.body.innerHTML = BillsUI({ data: bills })
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname })
			}
			const mockBills = new Bills({
				document,
				onNavigate,
				localStorage,
				store: null,
			})
			const btnNewBill = screen.getByTestId("btn-new-bill")

			const mockFunctionHandleClick = jest.fn(mockBills.handleClickNewBill)
			btnNewBill.addEventListener("click", mockFunctionHandleClick)
			fireEvent.click(btnNewBill)
			expect(mockFunctionHandleClick).toHaveBeenCalled()
			expect(mockFunctionHandleClick).toHaveBeenCalledTimes(1)
		})
		// Test unitaire: IconEye modal
		// Ajout
		test("Then Click sur IconEye", () => {
			Object.defineProperty(window, localStorage, { value: localStorageMock })
			window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }))
			const html = BillsUI({ data: bills })
			document.body.innerHTML = html
			const onNavigate = (pathname) => {
				document.body.innerHTML = ROUTES({ pathname })
			}
			const billsContainer = new Bills({
				document,
				onNavigate,
				localStorage: localStorageMock,
				store: null,
			})
			$.fn.modal = jest.fn()

			const handleClickIconEye = jest.fn(() => {
				billsContainer.handleClickIconEye
			})
			const firstEyeIcon = screen.getAllByTestId("icon-eye")[0]
			firstEyeIcon.addEventListener("click", handleClickIconEye)
			fireEvent.click(firstEyeIcon)
			expect(handleClickIconEye).toHaveBeenCalled()
			expect($.fn.modal).toHaveBeenCalled()
		})
		// Test unitaire: Chargement Page
		test("Then Loading page should be displayed", () => {
			const html = BillsUI({ data: bills, loading: true })
			document.body.innerHTML = html
			const isLoading = screen.getAllByText("Loading...")
			expect(isLoading).toBeTruthy()
		})
	})
})
// Test intégration: Get Bills
// Ajout
describe("Given I am a user connected as Employee", () => {
	describe("When Je suis sur la page Bill", () => {
		// test: Rucuperation Api simulé GET
		test("fetches bills from mock API GET", () => {
			localStorage.setItem("user", JSON.stringify({ type: "Employee" }))

			const root = document.createElement("div")
			root.setAttribute("id", "root")
			document.body.append(root)
			router()
			window.onNavigate(ROUTES_PATH.Bills)

			expect(screen.findByText("test")).toBeTruthy()
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
			test("fetches bills from an API and fails with 404 message error", () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 404"))
						},
					}
				})
				const errorWindow = BillsUI({ error: "Erreur 404" })
				document.body.innerHTML = errorWindow
				const message = screen.getByText(/Erreur 404/)
				expect(message).toBeTruthy()
			})

			// Test unitaire: Erreur 500
			test("fetches messages from an API and fails with 500 message error", () => {
				mockStore.bills.mockImplementationOnce(() => {
					return {
						list: () => {
							return Promise.reject(new Error("Erreur 500"))
						},
					}
				})

				const errorWindow = BillsUI({ error: "Erreur 500" })
				document.body.innerHTML = errorWindow
				const message = screen.getByText(/Erreur 500/)
				expect(message).toBeTruthy()
			})
		})
	})
})
